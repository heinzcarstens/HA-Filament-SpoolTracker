import { useState, useRef, useEffect } from 'react';
import type { Spool } from '@ha-addon/types';
import './SpoolSelect.css';

interface SpoolSelectProps {
  value: string | null;
  onChange: (spoolId: string | null) => void;
  spools: Spool[];
  placeholder?: string;
  size?: 'sm' | 'md';
  id?: string;
  'aria-label'?: string;
  /** When set, renders this instead of the default trigger (dot + label). Use to show card-style content. */
  renderTrigger?: (selected: Spool | null) => React.ReactNode;
  className?: string;
}

function getSpoolColor(spool: Spool): string {
  return spool.colorHex || spool.color || 'var(--text-muted)';
}

export default function SpoolSelect({
  value,
  onChange,
  spools,
  placeholder = 'None',
  size = 'md',
  id,
  'aria-label': ariaLabel,
  renderTrigger,
  className,
}: SpoolSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSpool = value ? spools.find((s) => s.id === value) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`spool-select spool-select-${size} ${open ? 'spool-select-open' : ''} ${className ?? ''}`.trim()}
    >
      <button
        type="button"
        id={id}
        className={`spool-select-trigger ${renderTrigger ? 'spool-select-trigger-custom' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {renderTrigger ? (
          <>
            {renderTrigger(selectedSpool)}
            <span className="spool-select-chevron" aria-hidden />
          </>
        ) : (
          <>
            {selectedSpool ? (
              <>
                <span
                  className="spool-select-dot"
                  style={{ backgroundColor: getSpoolColor(selectedSpool) }}
                />
                <span className="spool-select-label">
                  {selectedSpool.name} ({selectedSpool.filamentType})
                </span>
              </>
            ) : (
              <span className="spool-select-placeholder">{placeholder}</span>
            )}
            <span className="spool-select-chevron" aria-hidden />
          </>
        )}
      </button>
      {open && (
        <ul
          className="spool-select-dropdown"
          role="listbox"
          aria-activedescendant={value ?? undefined}
        >
          <li
            role="option"
            aria-selected={!value}
            className="spool-select-option"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <span className="spool-select-option-none">{placeholder}</span>
          </li>
          {spools.map((spool) => (
            <li
              key={spool.id}
              role="option"
              aria-selected={value === spool.id}
              className="spool-select-option"
              onClick={() => {
                onChange(spool.id);
                setOpen(false);
              }}
            >
              <span
                className="spool-select-dot"
                style={{ backgroundColor: getSpoolColor(spool) }}
              />
              <span className="spool-select-option-label">
                {spool.name} ({spool.filamentType})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
