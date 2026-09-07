import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Check, UserPlus, Users } from 'lucide-react';
import { useToast } from './Toast';

export default function Navbar() {
  const location = useLocation();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const isPublicForm = location.pathname === '/member-form';

  const handleShareForm = () => {
    const publicUrl = `${window.location.origin}/member-form`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    addToast('Public member form link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <nav className="sticky top-0 z-40 bg-rotary-navy/95 backdrop-blur-md text-white border-b border-rotary-gold/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Rotary Emblem Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rotary-gold to-amber-500 p-0.5 shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-full bg-rotary-navy flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-7 h-7 text-rotary-gold transition-transform duration-500 group-hover:rotate-45">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="7" />
                  <circle cx="50" cy="50" r="14" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                    <line x1="50" y1="8" x2="50" y2="24" />
                    <line x1="50" y1="76" x2="50" y2="92" />
                    <line x1="8" y1="50" x2="24" y2="50" />
                    <line x1="76" y1="50" x2="92" y2="50" />
                    <line x1="20" y1="20" x2="32" y2="32" />
                    <line x1="68" y1="68" x2="80" y2="80" />
                    <line x1="80" y1="20" x2="68" y2="32" />
                    <line x1="32" y1="68" x2="20" y2="80" />
                  </g>
                </svg>
              </div>
            </div>

            <div>
              <span className="font-display font-extrabold text-base sm:text-lg text-white tracking-tight">
                Rotary Club of Erode Central
              </span>
            </div>
          </Link>


          {/* Right Action Menu */}
          <div>
            {!isPublicForm ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    location.pathname === '/' || location.pathname === '/admin'
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Directory
                </Link>

                <Link
                  to="/member-form"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition hidden sm:inline-block"
                >
                  Member Form
                </Link>

                <button
                  onClick={handleShareForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rotary-gold text-rotary-navy hover:bg-amber-400 active:scale-95 transition shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Form</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-rotary-goldLight">
                Member Profile Form
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
