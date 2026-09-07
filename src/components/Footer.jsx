import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 px-4 border-t border-slate-800 mt-auto text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rotary-gold"></span>
          <span className="text-slate-200 font-semibold">Rotary Club of Erode Central</span>
        </div>

        <div className="text-slate-400 font-light">
          © {new Date().getFullYear()} All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
