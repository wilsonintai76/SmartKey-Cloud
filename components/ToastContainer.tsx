
import React from 'react';

interface Toast {
  title: string;
  message: string;
  type: "success" | "warning" | "danger" | "info";
  action?: () => void;
}

interface ToastContainerProps {
  toast: Toast | null;
  globalError: string | null;
  onClearToast: () => void;
  onClearGlobalError: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toast,
  globalError,
  onClearToast,
  onClearGlobalError
}) => {
  return (
    <>
      {globalError && (
        <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white p-3 z-[500] flex justify-between items-center shadow-lg animate-fadeIn text-sm font-medium">
          <div className="flex items-center gap-2 max-w-[1920px] mx-auto w-full px-4">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{globalError}</span>
          </div>
          <button
            onClick={onClearGlobalError}
            className="text-white hover:text-rose-200 ml-4 mr-4"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      
      {toast && (
        <div
          className={`fixed bottom-4 right-4 md:top-4 md:bottom-auto p-4 rounded-xl shadow-2xl z-[300] bg-white border-l-4 ${toast.type === "danger" ? "border-rose-500" : toast.type === "warning" ? "border-amber-500" : "border-emerald-500"} animate-fadeIn max-w-sm`}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={onClearToast}
              className="text-slate-300 hover:text-slate-500"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.();
                onClearToast();
              }}
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600"
            >
              Confirm Action
            </button>
          )}
        </div>
      )}
    </>
  );
};
