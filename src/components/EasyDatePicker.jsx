import React, { useState } from 'react';
import { Calendar, Cake, Heart, X, ChevronRight } from 'lucide-react';
import WheelDatePickerModal from './WheelDatePickerModal';
import { formatDateDisplay } from '../utils/dateUtils';

/**
 * Easy Date Picker Component
 * Opens the interactive iOS-style wheel picker on click.
 */
export default function EasyDatePicker({
  value = '',
  onChange,
  label = 'Select Date',
  type = 'general',
  minYear = 1930,
  maxYear = new Date().getFullYear(),
  compact = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const iconComponent = () => {
    if (type === 'dob') return <Cake className="w-4 h-4 text-amber-500" />;
    if (type === 'wedding') return <Heart className="w-4 h-4 text-rose-500" />;
    return <Calendar className="w-4 h-4 text-rotary-navy" />;
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
  };

  const hasValue = Boolean(value && value.trim());

  return (
    <>
      <div className="space-y-1.5 flex flex-col justify-start">
        {/* Field Label */}
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span className="inline-flex items-center gap-1.5">
            {iconComponent()}
            <span>{label}</span>
          </span>
        </label>

        {/* Clickable Date Card */}
        <div
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className={`w-full h-[52px] flex items-center justify-between rounded-2xl border transition-all cursor-pointer shadow-2xs group px-3.5 select-none ${
            hasValue
              ? 'bg-white border-slate-300 hover:border-rotary-gold hover:shadow-sm'
              : 'bg-slate-50/80 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
          }`}
        >
          {/* Left Side: Icon + Date / Placeholder */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                hasValue
                  ? type === 'dob'
                    ? 'bg-amber-100 text-amber-700'
                    : type === 'wedding'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-rotary-navy'
                  : 'bg-slate-200/70 text-slate-400 group-hover:text-slate-600'
              }`}
            >
              {iconComponent()}
            </div>

            <div className="min-w-0 flex-1 text-left">
              {hasValue ? (
                <div className="truncate">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                    {formatDateDisplay(value)}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 leading-none mt-0.5 truncate">
                    {value}
                  </p>
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-slate-400 font-medium truncate block">
                  Select {label.toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Action Button / Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}

            <span className="text-xs font-semibold text-rotary-navy group-hover:text-rotary-royal transition inline-flex items-center gap-0.5">
              <span>{hasValue ? 'Edit' : 'Select'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Wheel Date Picker Modal */}
      <WheelDatePickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        value={value}
        onConfirm={(newVal) => onChange?.(newVal)}
        title={label}
        type={type}
        minYear={minYear}
        maxYear={maxYear}
      />
    </>
  );
}

