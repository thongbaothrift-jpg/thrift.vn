'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxProps<T extends { id: string; name: string }> {
  options: T[];
  value: T | null;
  onChange: (item: T | null) => void;
  placeholder?: string;
  displayValue?: (item: T | null) => string;
  renderOption?: (item: T) => React.ReactNode;
  onCreate?: (name: string) => Promise<T | void>;
  className?: string;
}

export function Combobox<T extends { id: string; name: string }>({
  options,
  value,
  onChange,
  placeholder = 'Nhập hoặc chọn...',
  displayValue,
  renderOption,
  onCreate,
  className = '',
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = value
    ? (displayValue ? displayValue(value) : value.name)
    : '';

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize Vietnamese text by removing diacritics
  function normalizeVietnamese(str: string): string {
    return str
      .toLowerCase()
      // Decompose characters into base + combining marks
      .normalize('NFD')
      // Map Vietnamese letters to their base ASCII equivalent
      .replace(/[ăâàảãạáằẳẵắặầẩẫậấ]/gi, 'a')
      .replace(/[đ]/g, 'd')
      .replace(/[êèẻẽẹéềểễệế]/gi, 'e')
      .replace(/[ìỉĩịí]/gi, 'i')
      .replace(/[ôồốổỗộớờởõợơ]/gi, 'o')
      .replace(/[ùủũụúưựửữựư]/gi, 'u')
      .replace(/[ỳỷỹý]/gi, 'y')
      // Remove remaining combining diacritical marks (tone marks, etc.)
      .replace(/[\u0300-\u036f]/g, '')
      // Remove non-alphanumeric characters
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  const filtered = query.trim()
    ? options.filter(o =>
        normalizeVietnamese(o.name).includes(normalizeVietnamese(query))
      )
    : options;

  const handleSelect = useCallback((item: T) => {
    onChange(item);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
  }, [onChange]);

  const [creating, setCreating] = useState(false);

  const exactMatch = options.some(o => o.name.toLowerCase() === query.trim().toLowerCase());
  const showCreateOption = onCreate && query.trim() && !exactMatch;

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;
    try {
      setCreating(true);
      const newItem = await onCreate(query.trim());
      if (newItem) {
        onChange(newItem);
      }
      setOpen(false);
      setQuery('');
    } catch (e) {
      console.error('Failed to create new item:', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 bg-white cursor-text transition-all text-sm ${
          open
            ? 'border-black ring-2 ring-black/5'
            : 'border-zinc-200 hover:border-zinc-400'
        }`}
        onClick={() => { setOpen(true); setQuery(currentLabel); }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? query : currentLabel}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(currentLabel); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          placeholder={value ? '' : placeholder}
          className="flex-1 outline-none bg-transparent min-w-0 placeholder:text-zinc-400"
        />
        {value && open && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 && !showCreateOption ? (
              <div className="px-4 py-6 text-center text-sm text-zinc-400">
                Không tìm thấy
              </div>
            ) : (
              <>
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      value?.id === item.id
                        ? 'bg-black text-white font-medium'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {renderOption ? renderOption(item) : item.name}
                  </button>
                ))}
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-brand-red bg-red-50 hover:bg-red-100 transition-colors border-t border-red-100 flex items-center gap-2"
                  >
                    {creating ? (
                      <span className="animate-pulse">Đang tạo...</span>
                    ) : (
                      <>+ Tạo mới "{query}"</>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
