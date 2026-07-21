
import React from 'react';

interface HardwareRegistrationProps {
  isAddingModule: boolean;
  setIsAddingModule: (val: boolean) => void;
  onAddModule: () => void;
  currentRackCount: number;
}

export const HardwareRegistration: React.FC<HardwareRegistrationProps> = ({
  isAddingModule,
  setIsAddingModule,
  onAddModule,
  currentRackCount
}) => {
  const getRackName = (index: number) => `Pegboard ${String(index + 1).padStart(2, '0')}`;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-900 text-sm uppercase mb-6 flex items-center gap-3">
        <i className="fa-solid fa-square-plus text-blue-600"></i> Hardware Registration
      </h3>
      
      {!isAddingModule ? (
        <button 
          onClick={() => setIsAddingModule(true)} 
          className="w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <i className="fa-solid fa-plus-circle text-2xl group-hover:scale-110 transition-transform"></i>
          <span>Add Pegboard Module (4x Units)</span>
        </button>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase text-blue-400 mb-1 tracking-widest">Hardware Handshake</p>
              <p className="text-xs font-bold text-blue-800 leading-relaxed">
                Initializing <span className="underline decoration-blue-300 decoration-2">{getRackName(currentRackCount)}</span> cluster. 
                System will register 4 new addressable nodes.
              </p>
            </div>
            <i className="fa-solid fa-microchip absolute -right-4 -bottom-4 text-6xl text-blue-200/50 rotate-12"></i>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onAddModule} 
              className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
            >
              Confirm Registration
            </button>
            <button 
              onClick={() => setIsAddingModule(false)} 
              className="px-4 bg-slate-100 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
