
import React from 'react';
import { TelemetryCard } from './TelemetryCard';
import { AuditTrail } from './AuditTrail';
import { BatteryHealthCard } from './BatteryHealthCard';
import { ControllerStatus, LogEntry, KeySlot } from '../types';

interface DashboardSidebarProps {
  controllerStatus?: ControllerStatus;
  logs: LogEntry[];
  isAdminMode: boolean;
  onExport: () => void;
  slots: KeySlot[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  controllerStatus,
  logs,
  isAdminMode,
  onExport,
  slots
}) => {
  return (
    <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-[120px] h-fit">
      <TelemetryCard status={controllerStatus} />
      <BatteryHealthCard slots={slots} />
      <AuditTrail 
        logs={logs} 
        isAdminMode={isAdminMode} 
        onExport={onExport} 
      />
    </div>
  );
};
