
import React, { useState } from 'react';

interface OnboardingWizardProps {
  user: { name: string; email: string };
  onComplete: (data: { name: string; macAddress: string }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user.name === 'Technician' ? '' : user.name);
  const [mac, setMac] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (step === 2 && (!name.trim() || !mac.trim())) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setStep(step + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleFinish = () => {
    onComplete({ name, macAddress: mac.toUpperCase() });
  };

  const renderStep1 = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'} transition-all duration-300`}>
      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
        <i className="fa-solid fa-shield-halved text-4xl text-blue-600"></i>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-slate-900">Security Initialization</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
          To enable <strong>Offline Layer-2 Access</strong>, this device must be digitally bound to the Hardware Whitelist.
        </p>
      </div>
      <button onClick={handleNext} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
        Begin Setup
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'} transition-all duration-300`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-black text-slate-900">Identity & Binding</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Step 2 of 3</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1 block">Operator Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ahmad Zaki"
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>
        
        <div>
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1 mb-1 block">Device MAC Address</label>
          <div className="relative">
             <input 
              type="text" 
              value={mac}
              onChange={(e) => setMac(e.target.value.toUpperCase())}
              placeholder="00:1A:2B:3C:4D:5E"
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
            />
            <i className="fa-brands fa-bluetooth absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
            <i className="fa-solid fa-circle-info text-blue-400 mr-1"></i>
            Find this in your OS Bluetooth Settings under "Hardware Address" or "Physical Address".
          </p>
        </div>
      </div>

      <button 
        onClick={handleNext} 
        disabled={!name || !mac}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Verify Credentials
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className={`space-y-6 ${isAnimating ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'} transition-all duration-300`}>
       <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 animate-pulse">
        <i className="fa-solid fa-check text-4xl text-emerald-500"></i>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-slate-900">Binding Complete</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
          Your credentials have been cached. You may now access the <strong>Emergency AP</strong> mode if the internet fails.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase text-slate-400">Identity</span>
            <span className="text-[10px] font-bold text-slate-700">{name}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase text-slate-400">Bound MAC</span>
            <span className="text-[10px] font-mono font-bold text-slate-700">{mac}</span>
        </div>
      </div>

      <button onClick={handleFinish} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
        Enter Dashboard
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 md:p-10 max-w-md w-full relative shadow-2xl border-t-4 border-blue-500 animate-fadeIn">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        
        <div className="flex justify-center gap-2 mt-8">
            <div className={`w-2 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        </div>
      </div>
    </div>
  );
};
