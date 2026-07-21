import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch animate-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
};
