
import React from 'react';

interface SystemGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuide: React.FC<SystemGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
      <div className="bg-white rounded-[48px] shadow-2xl p-8 md:p-12 max-w-4xl w-full relative border border-white/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start mb-10 shrink-0">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-[20px] bg-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-200">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Manual</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] ml-1">
              SecureKey v3.0 • ESP32 Dev Board
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-50 transition-all border border-slate-100"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12 pb-6">
          
          {/* Section: Interface Glossary */}
          <div>
            <h3 className="text-[10px] font-black uppercase text-blue-600 mb-6 tracking-widest flex items-center gap-3">
              <i className="fa-solid fa-icons"></i> Interface Glossary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: 'fa-shield-heart', label: 'Manual', color: 'bg-blue-600', desc: 'System Guide' },
                { icon: 'fa-tower-broadcast', label: 'Failover', color: 'bg-amber-500', desc: 'Local BLE Mode' },
                { icon: 'fa-user-shield', label: 'Auth Node', color: 'bg-slate-800', desc: 'Admin Mode' },
                { icon: 'fa-power-off', label: 'Unlock', color: 'bg-blue-600', desc: 'Unlock Cabinet' },
                { icon: 'fa-lock', label: 'Inhibit', color: 'bg-amber-500', desc: 'Service Lock' },
                { icon: 'fa-network-wired', label: 'Topology', color: 'bg-slate-700', desc: 'Hardware Map' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all">
                  <div className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <i className={`fa-solid ${item.icon} text-xs`}></i>
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-900 tracking-tighter mb-1">{item.label}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Engineering Truths (Lifecycle & RTC) */}
          <div className="p-8 bg-slate-900 rounded-[40px] text-white relative overflow-hidden group">
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
               
               {/* Lifecycle Explanation */}
               <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-gears"></i> Mechanical Fatigue Analysis
                 </h3>
                 <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                   While both components degrade, they do not share the same lifecycle:
                 </p>
                 <ul className="space-y-3">
                   <li className="flex gap-3">
                     <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                     <div>
                       <p className="text-[10px] font-bold text-white uppercase">Main Cabinet Solenoid (Door)</p>
                       <p className="text-[9px] text-slate-400">Fails first (approx 50k cycles) due to thermal breakdown of coil insulation and magnetic remnant buildup. Controls access to the entire key array.</p>
                     </div>
                   </li>
                   <li className="flex gap-3">
                     <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                     <div>
                       <p className="text-[10px] font-bold text-white uppercase">Key Slot Microswitch (Peg Sensor)</p>
                       <p className="text-[9px] text-slate-400">Lasts longer (approx 100k+ cycles). Detects key peg presence in modular units. Modular peg-in/peg-out units hold the keys, while the master cabinet door physically secures the entire array.</p>
                     </div>
                   </li>
                 </ul>
                 <p className="text-[9px] text-slate-500 italic mt-2 border-t border-white/10 pt-2">
                   *The dashboard tracks "Cabinet Actuator Life" & "Microswitch Life" for safety.
                 </p>
               </div>

               {/* RTC Explanation */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-battery-half"></i> RTC Battery Monitoring
                 </h3>
                 <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                   The ESP32 Dev Vroom board manages the solenoid control. In "Offline Mode" (No Internet), it relies on an internal CR2032 Battery (if connected) or RTC module to keep time.
                 </p>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Nominal Voltage</span>
                     <span className="text-[9px] font-mono font-bold text-emerald-400">3.0V</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Critical Threshold</span>
                     <span className="text-[9px] font-mono font-bold text-rose-400">&lt; 2.5V</span>
                   </div>
                 </div>
                 <p className="text-[9px] text-amber-500/80 font-bold uppercase tracking-tight">
                   Warning: If RTC battery dies during a power outage, offline audit logs will have incorrect timestamps (Epoch 1970).
                 </p>
               </div>
             </div>
             <i className="fa-solid fa-microchip absolute -right-12 -bottom-12 text-[200px] text-white/[0.03] rotate-12 pointer-events-none"></i>
          </div>

          {/* New Section: Hybrid Offline Architecture */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest ml-1 flex items-center gap-2">
              <i className="fa-solid fa-network-wired"></i> Hybrid Offline Architecture ("No-SD" Logic)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 bg-white border border-slate-100 rounded-[24px]">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase mb-2">1. App Persistence</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  <strong>Service Worker</strong> caching allows the dashboard to launch instantly without internet. Install via "Add to Home Screen" for a native app-like experience.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-[24px]">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <i className="fa-solid fa-fingerprint"></i>
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase mb-2">2. LittleFS Storage</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  We replaced unreliable SD Cards with <strong>Internal SPI Flash</strong>. 
                  The <code>whitelist.json</code> is stored on a LittleFS partition, ensuring <strong>Atomic Writes</strong> and zero mechanical vibration failure.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-[24px]">
                 <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                  <i className="fa-brands fa-bluetooth"></i>
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase mb-2">3. BLE Fallback</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  If internet fails, the dashboard switches to <strong>Local Mode</strong>, connecting directly to the controller via Bluetooth Low Energy (WebBLE).
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-100 rounded-[24px]">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <i className="fa-solid fa-rotate"></i>
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase mb-2">4. Store-and-Forward</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Actions performed offline are buffered locally in IndexedDB. Once the <strong>Network Link</strong> is restored, the system batch-uploads logs to Cloudflare D1 via the Hono API to maintain data consistency.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Cloud Backend Reference */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-[32px] mb-6">
             <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2">
               <i className="fa-solid fa-cloud"></i> Cloudflare Workers + D1
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Backend Host</p>
                 <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-blue-600 truncate">
                   Cloudflare Workers (Hono)
                 </div>
               </div>
               <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Data Engine</p>
                 <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-emerald-600 truncate">
                   D1 (SQLite) + KV + R2
                 </div>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
