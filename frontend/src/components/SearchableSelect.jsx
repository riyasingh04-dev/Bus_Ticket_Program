import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({ options, placeholder, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find(o => String(o.id) === String(value));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      {label && <label>{label}</label>}
      
      <div 
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'white',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          minHeight: '44px',
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: selectedOption ? 'var(--dark)' : 'var(--gray-light)' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={18} className="text-gray" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          padding: '8px',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--gray)' }} />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 32px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none'
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          <div style={{ overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  className="select-option"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    background: String(value) === String(opt.id) ? 'var(--primary-light)' : 'transparent',
                    color: String(value) === String(opt.id) ? 'var(--primary)' : 'var(--dark)',
                  }}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray)', fontSize: '13px' }}>
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
