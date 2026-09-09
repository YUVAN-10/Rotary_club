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
  value = [],
  onChange,
  customValue = '',
  onCustomChange,
  label = 'Vertical / Classification',
  required = false,
  error = '',
  placeholder = 'Select Business Categories / Verticals...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL'); // 'ALL' | 'SELECTED' | 'A'..'Z' | 'OTHER'
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize value to an array of strings
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

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

  // All alphabet letters A to Z
  const lettersList = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }, []);

  // Count categories per letter
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

  // Filter options based on letter, search, and selected tab
  const filteredOptions = useMemo(() => {
    return VERTICAL_OPTIONS.filter((opt) => {
      if (!opt) return false;

      // Filter by selected tab
      if (selectedLetter === 'SELECTED') {
        return selectedValues.includes(opt);
      }

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
  }, [searchTerm, selectedLetter, selectedValues]);

  // Group filtered options by starting letter for clean hierarchy
  const groupedOptions = useMemo(() => {
    const groups = {};
    filteredOptions.forEach((opt) => {
      const key = opt === 'Other' ? 'Other' : opt.charAt(0).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // Toggle single option selection
  const handleToggleOption = (option) => {
    let nextValues;
    if (selectedValues.includes(option)) {
      nextValues = selectedValues.filter((v) => v !== option);
      if (option === 'Other' && onCustomChange) {
        onCustomChange('');
      }
    } else {
      nextValues = [...selectedValues, option];
    }
    onChange?.(nextValues);
  };

  // Remove a specific tag
  const handleRemoveTag = (e, option) => {
    e.stopPropagation();
    const nextValues = selectedValues.filter((v) => v !== option);
    if (option === 'Other' && onCustomChange) {
      onCustomChange('');
    }
    onChange?.(nextValues);
  };

  // Clear all selections
  const handleClearAll = (e) => {
    e?.stopPropagation();
    onChange?.([]);
    if (onCustomChange) {
      onCustomChange('');
    }
  };

  const isOtherSelected = selectedValues.includes('Other');

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {selectedValues.length > 0 && (
            <span className="text-[11px] font-bold text-rotary-royal bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {selectedValues.length} {selectedValues.length === 1 ? 'category' : 'categories'} selected
            </span>
          )}
        </div>
      )}

      {/* Main Trigger Box */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[48px] px-3.5 py-2 rounded-2xl border text-sm transition-all cursor-pointer bg-white shadow-sm flex items-center justify-between gap-2.5 ${
          isOpen
            ? 'border-rotary-darkBlue ring-2 ring-rotary-gold/40 shadow-md'
            : error
            ? 'border-rose-400 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            selectedValues.length > 0 ? 'bg-rotary-navy text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            <Tag className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            {selectedValues.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                {selectedValues.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-rotary-navy border border-blue-200/90 shadow-2xs"
                  >
                    <span className="truncate max-w-[160px] sm:max-w-[220px]">
                      {val === 'Other' && customValue ? `Other: ${customValue}` : val}
                    </span>
                    <span
                      onClick={(e) => handleRemoveTag(e, val)}
                      title={`Remove ${val}`}
                      className="p-0.5 rounded hover:bg-blue-200 text-slate-400 hover:text-slate-800 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400 font-normal truncate block text-xs sm:text-sm">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Clear all selections"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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

      {/* Expandable Category Selection Panel with Checkboxes */}
      {isOpen && (
        <div className="mt-2 bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in duration-200 flex flex-col z-20">
          
          {/* Header Area */}
          <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 space-y-3">
            
            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories (e.g. Textile, Solar, Health, Auto...)"
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

            {/* Quick Alphabet Selector Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rotary-gold"></span>
                  <span>Browse by Letter (A–Z) & Multi-select</span>
                </span>
                <div className="flex items-center gap-2">
                  {selectedValues.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLetter(selectedLetter === 'SELECTED' ? 'ALL' : 'SELECTED')}
                      className={`text-xs font-bold px-2 py-0.5 rounded-md transition ${
                        selectedLetter === 'SELECTED'
                          ? 'bg-blue-600 text-white'
                          : 'text-rotary-royal bg-blue-50 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      Selected ({selectedValues.length})
                    </button>
                  )}
                  {selectedLetter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedLetter('ALL')}
                      className="text-xs text-slate-600 font-bold hover:underline"
                    >
                      Show All (100)
                    </button>
                  )}
                </div>
              </div>

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
                  const isSelectedTab = selectedLetter === letter;
                  const hasItems = count > 0;
                  // Count how many selected in this letter
                  const selectedInLetter = selectedValues.filter(
                    (v) => v !== 'Other' && v.charAt(0).toUpperCase() === letter
                  ).length;

                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!hasItems}
                      onClick={() => {
                        if (hasItems) {
                          setSelectedLetter(isSelectedTab ? 'ALL' : letter);
                        }
                      }}
                      className={`relative w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition ${
                        isSelectedTab
                          ? 'bg-rotary-navy text-white shadow-sm ring-2 ring-rotary-gold/60'
                          : hasItems
                          ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-rotary-gold/20 hover:border-rotary-gold/60 hover:text-rotary-navy'
                          : 'text-slate-300 bg-slate-50/50 border border-transparent cursor-not-allowed opacity-40'
                      }`}
                      title={hasItems ? `${letter} (${count} categories${selectedInLetter ? `, ${selectedInLetter} selected` : ''})` : `${letter} (0)`}
                    >
                      {letter}
                      {selectedInLetter > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rotary-gold rounded-full ring-1 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grouped Category Options List with Checkboxes */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-300">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 px-4 space-y-2">
                <p className="text-sm font-bold text-slate-700">No categories found</p>
                <p className="text-xs text-slate-500">
                  {selectedLetter === 'SELECTED'
                    ? 'No categories are currently selected.'
                    : 'Try another keyword or select "Other" to enter your custom classification.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleOption('Other')}
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

                  {/* Items in this group with Checkboxes */}
                  <div className="space-y-1">
                    {items.map((opt) => {
                      const isChecked = selectedValues.includes(opt);

                      return (
                        <div
                          key={opt}
                          onClick={() => handleToggleOption(opt)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer select-none border ${
                            isChecked
                              ? 'bg-blue-50/90 text-rotary-navy font-bold border-blue-200 shadow-2xs'
                              : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox Box */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                              isChecked
                                ? 'bg-rotary-navy text-white shadow-xs'
                                : 'border-2 border-slate-300 bg-white hover:border-rotary-darkBlue'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <span className="truncate">
                              {opt}
                            </span>
                          </div>

                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex-shrink-0">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {selectedValues.length} selected
              </span>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleOption('Other')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  isOtherSelected
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-rotary-navy hover:bg-blue-50'
                }`}
              >
                + "Other"
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1 rounded-xl bg-rotary-navy hover:bg-rotary-darkBlue text-white font-bold text-xs transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Custom Specification Field (when "Other" is checked) */}
      {isOtherSelected && (
        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 animate-in fade-in duration-200 space-y-1.5">
          <label className="block text-xs font-bold text-amber-900">
            Specify Custom Business Category / Classification {required && selectedValues.length === 1 && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            required={required && selectedValues.length === 1}
            value={customValue}
            onChange={(e) => onCustomChange?.(e.target.value)}
            placeholder="e.g. Textile Machinery, Automation, Solar EPC, Drone Survey..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-600 bg-white text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
