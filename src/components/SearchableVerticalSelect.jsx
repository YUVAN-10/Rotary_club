import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  Search, 
  Check, 
  X, 
  Tag, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VERTICAL_OPTIONS } from '../constants/verticals';

export default function SearchableVerticalSelect({
  value = '',
  onChange,
  customValue = '',
  onCustomChange,
  label = 'Vertical / Classification',
  required = false,
  error = '',
  placeholder = 'Select Business Category / Vertical...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setSelectedLetter('ALL');
    }
  }, [isOpen]);

  // Extract all available letters (A to Z) present in VERTICAL_OPTIONS
  const lettersList = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }, []);

  // Count items per letter
  const letterCounts = useMemo(() => {
    const counts = {};
    VERTICAL_OPTIONS.forEach((opt) => {
      if (opt && opt !== 'Other') {
        const l = opt.charAt(0).toUpperCase();
        counts[l] = (counts[l] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Filter options
  const filteredOptions = useMemo(() => {
    return VERTICAL_OPTIONS.filter((opt) => {
      if (!opt) return false;

      // Filter by letter
      if (selectedLetter !== 'ALL') {
        if (opt === 'Other') return selectedLetter === 'OTHER';
        if (opt.charAt(0).toUpperCase() !== selectedLetter) return false;
      }

      // Filter by search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return opt.toLowerCase().includes(query);
      }

      return true;
    });
  }, [searchTerm, selectedLetter]);

  // Group filtered options by starting letter for easy visual scanning
  const groupedOptions = useMemo(() => {
    const groups = {};
    filteredOptions.forEach((opt) => {
      const key = opt === 'Other' ? 'Other' : opt.charAt(0).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  const handleSelect = (option) => {
    onChange?.(option);
    if (option !== 'Other' && onCustomChange) {
      onCustomChange('');
    }
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    if (onCustomChange) {
      onCustomChange('');
    }
  };

  const isOther = value === 'Other';

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {value && (
            <span className="text-[11px] font-semibold text-rotary-royal bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              1 category selected
            </span>
          )}
        </div>
      )}

      {/* Main Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-3 rounded-2xl border text-sm transition-all cursor-pointer bg-white shadow-sm flex items-center justify-between gap-3 ${
          isOpen
            ? 'border-rotary-darkBlue ring-2 ring-rotary-gold/40 shadow-md'
            : error
            ? 'border-rose-400 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400 hover:shadow'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            value ? 'bg-rotary-navy text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            <Tag className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1 text-left">
            {value ? (
              <div>
                <p className="font-bold text-slate-800 text-sm truncate leading-tight">
                  {value === 'Other' && customValue ? `Other: ${customValue}` : value}
                </p>
                <p className="text-[11px] text-slate-400">Selected Business Vertical</p>
              </div>
            ) : (
              <span className="text-slate-400 font-normal truncate block">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-rotary-navy bg-blue-50' : 'bg-slate-50'
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[440px]">
          
          {/* Header Area */}
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by category name (e.g. Textile, Solar, Health, Auto...)"
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rotary-gold/50 focus:border-rotary-darkBlue text-slate-800 placeholder:text-slate-400 shadow-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Alphabet Selector Grid (2 clean rows, NO horizontal scroll needed) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rotary-gold"></span>
                  <span>Browse by Letter (A–Z)</span>
                </span>
                {selectedLetter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedLetter('ALL')}
                    className="text-xs text-rotary-royal font-bold hover:underline"
                  >
                    Show All (100)
                  </button>
                )}
              </div>

              {/* Complete Alphabet Grid (Wrapped cleanly, no horizontal scrolling) */}
              <div className="flex flex-wrap items-center gap-1 bg-white p-2 rounded-xl border border-slate-200">
                {/* All Button */}
                <button
                  type="button"
                  onClick={() => setSelectedLetter('ALL')}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition ${
                    selectedLetter === 'ALL'
                      ? 'bg-rotary-navy text-white shadow-sm ring-1 ring-rotary-navy'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ALL ({VERTICAL_OPTIONS.length - 1})
                </button>

                {/* Letters A-Z */}
                {lettersList.map((letter) => {
                  const count = letterCounts[letter] || 0;
                  const isSelected = selectedLetter === letter;
                  const hasItems = count > 0;

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!hasItems}
                      onClick={() => {
                        if (hasItems) {
                          setSelectedLetter(isSelected ? 'ALL' : letter);
                        }
                      }}
                      className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition ${
                        isSelected
                          ? 'bg-rotary-navy text-white shadow-sm ring-2 ring-rotary-gold/60'
                          : hasItems
                          ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-rotary-gold/20 hover:border-rotary-gold/60 hover:text-rotary-navy'
                          : 'text-slate-300 bg-slate-50/50 border border-transparent cursor-not-allowed opacity-40'
                      }`}
                      title={hasItems ? `${letter} (${count} categories)` : `${letter} (0)`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grouped Category Options List */}
          <div 
            ref={listContainerRef}
            className="overflow-y-auto flex-1 p-2 space-y-3 divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-300"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 px-4 space-y-2">
                <p className="text-sm font-bold text-slate-700">No categories found</p>
                <p className="text-xs text-slate-500">
                  Try another keyword or select "Other" to specify a custom category.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelect('Other')}
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-rotary-navy text-white hover:bg-rotary-darkBlue transition shadow-sm"
                >
                  <span>Select "Other" (Custom Sector)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              Object.entries(groupedOptions).map(([letterKey, items]) => (
                <div key={letterKey} className="pt-2 first:pt-0">
                  {/* Letter Group Header */}
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-rotary-navy font-bold text-xs">
                      {letterKey === 'Other' ? '✦' : letterKey}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Items in this group */}
                  <div className="space-y-0.5">
                    {items.map((opt) => {
                      const isSelected = value === opt;
                      const isItemOther = opt === 'Other';

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelect(opt)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 text-rotary-navy font-bold border border-blue-200/80 shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-rotary-gold' : isItemOther ? 'bg-amber-400' : 'bg-slate-300'
                            }`} />
                            <span className="truncate">
                              {opt}
                            </span>
                          </div>

                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rotary-navy bg-white px-2 py-0.5 rounded-md border border-blue-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Selected</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-medium">
              Showing <span className="font-bold text-slate-800">{filteredOptions.length}</span> categories
            </span>
            <button
              type="button"
              onClick={() => handleSelect('Other')}
              className="text-xs font-bold text-rotary-navy hover:underline"
            >
              Cannot find? Choose "Other"
            </button>
          </div>

        </div>
      )}

      {/* Custom Specification Field (when "Other" is chosen) */}
      {isOther && (
        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 animate-in fade-in duration-200 space-y-1.5">
          <label className="block text-xs font-bold text-amber-900">
            Specify Custom Business Category {required && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            value={customValue}
            onChange={(e) => onCustomChange?.(e.target.value)}
            placeholder="e.g. Textile Machinery, Automation, Solar Installation..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-600 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
