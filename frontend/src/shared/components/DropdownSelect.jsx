import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, Plus } from 'lucide-react';

/**
 * DropdownSelect — custom searchable combobox dropdown with down arrow chevron.
 *
 * Supports:
 *   - Preset options list
 *   - Real-time search filtering
 *   - Custom typed value selection (e.g. local college or district city)
 */
export default function DropdownSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  id,
  disabled = false,
  className = '',
  searchable = true,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Normalise options to { value, label }
  const normalised = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  const selectedOpt = normalised.find(o => o.value === value);
  const displayLabel = selectedOpt?.label || value || placeholder;

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = normalised.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExactMatch = normalised.some(
    opt => opt.label.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleSelect = val => {
    onChange(val);
    setOpen(false);
    setSearchQuery('');
  };

  const handleKey = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={ref}>
      {label && (
        <label htmlFor={selectId} className="text-[12px] font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          onKeyDown={handleKey}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-[13px]
            bg-card text-left transition-colors duration-150
            ${open ? 'border-accent-blue' : 'border-border'}
            ${error ? 'border-accent-red' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-blue/50 cursor-pointer'}
            ${value ? 'text-text' : 'text-muted'}
          `}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            size={14}
            className={`text-muted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-card overflow-hidden animate-fade-in"
            role="listbox"
          >
            {/* Search Box inside Dropdown */}
            {searchable && (
              <div className="p-2 border-b border-border bg-surface/80 flex items-center gap-2">
                <Search size={14} className="text-muted flex-shrink-0 ml-1" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type to search or enter custom..."
                  className="w-full bg-transparent text-[12px] text-text placeholder:text-muted focus:outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      handleSelect(searchQuery.trim());
                    }
                  }}
                />
              </div>
            )}

            {/* Custom typed option if not exact match */}
            {searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors border-b border-border/60 text-left"
              >
                <Plus size={13} /> Use custom: "{searchQuery.trim()}"
              </button>
            )}

            {/* Scrollable Options List */}
            <div className="max-h-56 overflow-y-auto py-1 no-scrollbar">
              {filtered.length > 0 ? (
                filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={opt.value === value}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-[12px] text-left transition-colors
                      ${opt.value === value
                        ? 'bg-accent-blue/15 text-accent-blue font-semibold'
                        : 'text-text hover:bg-surface'
                      }
                    `}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && <Check size={13} className="text-accent-blue flex-shrink-0" />}
                  </button>
                ))
              ) : (
                !searchQuery.trim() && (
                  <p className="text-[12px] text-muted text-center py-4">No options available</p>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-accent-red">{error}</p>}
    </div>
  );
}
