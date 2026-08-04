
import React, { useState, useEffect } from 'react';
import { ControllerStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryCardProps {
  status?: ControllerStatus;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({ status }) => {
  // Use real values if available, otherwise show placeholders indicating no data
  const rtcVoltage = status?.voltage ?? 0;
  const isRtcHealthy = rtcVoltage > 2.6;
  const rssi = status?.rssi ?? 0;
  const uptime = status?.uptime ?? "Unknown";

  const [rssiHistory, setRssiHistory] = useState<{ time: string; value: number }[]>([]);

  useEffect(() => {
    if (rssi !== 0) {
      setRssiHistory(prev => {
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newHistory = [...prev, { time: timeString, value: rssi }];
        return newHistory.slice(-20); // Keep last 20 readings
      });
    }
  }, [rssi]);

  return (
    <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[40px] shadow-xl relative overflow-hidden group">
      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 tracking-[0.2em]">ESP32 DevKitC Telemetry</h3>
      <div className="space-y-6 relative z-10">
        {/* Cabinet Door Status */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status?.doorOpen ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                <i className={`fa-solid ${status?.doorOpen ? 'fa-door-open text-amber-500' : 'fa-door-closed text-emerald-500'} text-xs`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Cabinet Door</p>
                <p className={`text-xs font-black uppercase ${!status?.online ? 'text-slate-500' : status.doorOpen ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {!status?.online ? '-- NO DATA' : status.doorOpen ? 'OPEN' : 'LOCKED'}
                </p>
              </div>
            </div>
            {status?.online && (
               <div className="flex items-center gap-1">
                 <div className={`w-1 h-1 rounded-full ${status.doorOpen ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></div>
                 <span className="text-[8px] font-bold text-slate-500 uppercase">Live Sensor</span>
               </div>
            )}
          </div>
        </div>

        {/* BLE Signal */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
            <span>BLE Signal (RSSI)</span>
            <span className={rssi > -60 ? "text-emerald-400" : "text-blue-400"}>{rssi === 0 ? '--' : `${rssi} dBm`}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: rssi === 0 ? '0%' : `${Math.min(100, Math.max(0, (100 + rssi) * 2))}%` }}
            ></div>
          </div>
          
          {rssiHistory.length > 0 && (
            <div className="h-32 w-full mt-4 bg-slate-950/50 rounded-xl p-2 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rssiHistory}>
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={15}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[-100, -30]}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px', borderRadius: '8px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* RTC Battery Monitor */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
            <span className="flex items-center gap-2">
              RTC Battery (CR2032)
              {!isRtcHealthy && rtcVoltage > 0 && <i className="fa-solid fa-triangle-exclamation text-rose-500 animate-pulse"></i>}
            </span>
            <span className={isRtcHealthy ? "text-emerald-400" : "text-rose-400"}>{rtcVoltage > 0 ? `${rtcVoltage}V` : '--'}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isRtcHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} 
              style={{ width: `${(rtcVoltage / 3.3) * 100}%` }}
            ></div>
          </div>
          <p className="text-[8px] text-slate-500 mt-1 font-mono">Required for Offline Timekeeping</p>
        </div>

        {/* Logic State */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
            <span>Logic State</span>
            <span className={status?.online ? "text-emerald-400" : "text-rose-400"}>{status?.online ? "Active" : "Disconnected"}</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full w-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Uptime</span>
          <span className="font-mono text-xs text-blue-300">{uptime}</span>
        </div>
      </div>
      <i className="fa-solid fa-battery-half absolute -bottom-6 -right-6 text-7xl text-white/5 group-hover:scale-110 transition-transform"></i>
    </div>
  );
};

