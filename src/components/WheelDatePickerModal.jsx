import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, Calendar, Cake, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDateDisplay } from '../utils/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 44; // px per row item in the wheel
const VISIBLE_COUNT = 5; // 5 visible rows (center is index 2)

/**
 * Scrollable Wheel Column Component
 */
function WheelColumn({ items, selectedValue, onSelect, label, width = 'w-1/3' }) {
  const containerRef = useRef(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  const selectedIndex = useMemo(() => {
    const idx = items.findIndex(item => String(item.value) === String(selectedValue));
    return idx >= 0 ? idx : 0;
  }, [items, selectedValue]);

  // Scroll to selected item smoothly when index changes from outside
  useEffect(() => {
    if (containerRef.current && !isUserScrolling.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [selectedIndex]);

  // Handle scroll snap
  const handleScroll = (e) => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
        
        // Snap scroll to exact row
        containerRef.current.scrollTo({
          top: clampedIndex * ITEM_HEIGHT,
          behavior: 'smooth'
        });

        if (items[clampedIndex] && String(items[clampedIndex].value) !== String(selectedValue)) {
          onSelect(items[clampedIndex].value);
        }
      }
      isUserScrolling.current = false;
    }, 120);
  };

  const handleItemClick = (index, value) => {
    onSelect(value);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  };

  const handleStep = (delta) => {
    const nextIdx = Math.max(0, Math.min(selectedIndex + delta, items.length - 1));
    handleItemClick(nextIdx, items[nextIdx].value);
  };

  return (
    <div className={`flex flex-col items-center ${width} select-none`}>
      {/* Up Arrow for Desktop / Precise Tapping */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        className="w-full py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition"
        title={`Previous ${label}`}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Wheel Container */}
      <div className="relative w-full h-[220px] overflow-hidden">
        {/* Top & Bottom Fade Gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/80 to-transparent z-10"></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10"></div>

        {/* Center Target Highlight */}
        <div 
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] bg-rotary-gold/10 border-y border-slate-300 z-0 rounded-lg"
        ></div>

        {/* Scrollable list */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[88px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, idx) => {
            const isSelected = String(item.value) === String(selectedValue);
            const dist = Math.abs(idx - selectedIndex);
            
            return (
              <div
                key={item.value}
                onClick={() => handleItemClick(idx, item.value)}
                className={`h-[44px] flex items-center justify-center cursor-pointer transition-all duration-150 snap-center px-1 ${
                  isSelected
                    ? 'text-slate-900 font-bold text-lg sm:text-xl scale-105'
                    : dist === 1
                    ? 'text-slate-500 font-medium text-sm sm:text-base opacity-75'
                    : 'text-slate-400 font-normal text-xs sm:text-sm opacity-40'
                }`}
              >
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Down Arrow */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        className="w-full py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition"
        title={`Next ${label}`}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * iOS / Wheel Style Date Picker Bottom-Sheet Modal
 */
export default function WheelDatePickerModal({
  isOpen,
  onClose,
  value = '',
  onConfirm,
  title = 'Select Date',
  type = 'dob',
  minYear = 1930,
  maxYear = new Date().getFullYear()
}) {
  // Parse initial date or setup default
  const [tempYear, setTempYear] = useState('1985');
  const [tempMonth, setTempMonth] = useState('06');
  const [tempDay, setTempDay] = useState('14');


  useEffect(() => {
    if (isOpen) {
      if (value && typeof value === 'string' && value.includes('-')) {
        const parts = value.split('-');
        if (parts.length === 3) {
          setTempYear(parts[0]);
          setTempMonth(parts[1].padStart(2, '0'));
          setTempDay(parts[2].padStart(2, '0'));
          return;
        }
      }
      // Smart default when opening with no date
      if (type === 'dob') {
        setTempYear('1980');
        setTempMonth('06');
        setTempDay('14');
      } else if (type === 'wedding') {
        setTempYear('2010');
        setTempMonth('11');
        setTempDay('20');
      } else {
        const now = new Date();
        setTempYear(String(now.getFullYear()));
        setTempMonth(String(now.getMonth() + 1).padStart(2, '0'));
        setTempDay(String(now.getDate()).padStart(2, '0'));
      }
    }
  }, [isOpen, value, type]);

  // Compute dynamic days in selected month
  const daysInMonth = useMemo(() => {
    const y = parseInt(tempYear, 10) || 2024;
    const m = parseInt(tempMonth, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [tempYear, tempMonth]);

  // Adjust day if selected day > daysInMonth
  useEffect(() => {
    if (parseInt(tempDay, 10) > daysInMonth) {
      setTempDay(String(daysInMonth).padStart(2, '0'));
    }
  }, [daysInMonth, tempDay]);

  // Options lists
  const monthItems = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => ({
      value: String(idx + 1).padStart(2, '0'),
      label: name
    }));
  }, []);

  const dayItems = useMemo(() => {
    const items = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const val = String(d).padStart(2, '0');
      items.push({ value: val, label: String(d) });
    }
    return items;
  }, [daysInMonth]);

  const yearItems = useMemo(() => {
    const items = [];
    for (let y = maxYear; y >= minYear; y--) {
      items.push({ value: String(y), label: String(y) });
    }
    return items;
  }, [minYear, maxYear]);

  if (!isOpen) return null;

  const handleDone = () => {
    const formatted = `${tempYear}-${tempMonth}-${tempDay}`;
    onConfirm(formatted);
    onClose();
  };

  const handleClear = () => {
    onConfirm('');
    onClose();
  };

  const currentFormatted = formatDateDisplay(`${tempYear}-${tempMonth}-${tempDay}`);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Cancel
          </button>

          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
              {type === 'dob' ? <Cake className="w-4 h-4 text-amber-500" /> : type === 'wedding' ? <Heart className="w-4 h-4 text-rose-500" /> : <Calendar className="w-4 h-4 text-rotary-navy" />}
              <span>{title}</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition"
          >
            Next
          </button>
        </div>

        {/* 3 Wheel Columns: Month | Day | Year (Matches the reference screenshot) */}
        <div className="px-4 py-4 bg-white">
          <div className="flex items-center justify-around gap-1">
            {/* Month Column */}
            <WheelColumn
              items={monthItems}
              selectedValue={tempMonth}
              onSelect={(val) => setTempMonth(val)}
              label="Month"
              width="w-2/5"
            />

            {/* Day Column */}
            <WheelColumn
              items={dayItems}
              selectedValue={tempDay}
              onSelect={(val) => setTempDay(val)}
              label="Day"
              width="w-1/4"
            />

            {/* Year Column */}
            <WheelColumn
              items={yearItems}
              selectedValue={tempYear}
              onSelect={(val) => setTempYear(val)}
              label="Year"
              width="w-1/3"
            />
          </div>
        </div>

        {/* Selected Date Summary & Confirm Bottom Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{type === 'dob' ? '🎂' : type === 'wedding' ? '💍' : '🗓️'}</span>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Date</p>
              <p className="text-sm font-bold text-slate-800">{currentFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                Clear Date
              </button>
            )}
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-rotary-navy hover:bg-rotary-darkBlue text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-rotary-gold" />
              <span>Confirm & Set Date</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
