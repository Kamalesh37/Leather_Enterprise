import React from 'react';
import { Menu, Search, PackagePlus, Plus } from 'lucide-react';

interface NavbarProps {
  title: string;
  description: string;
  onToggleMobile: () => void;
  onOpenNewPart: () => void;
  onOpenRestock: () => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  description,
  onToggleMobile,
  onOpenNewPart,
  onOpenRestock,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleMobile} aria-label="Toggle Sidebar">
          <Menu size={22} />
        </button>
        <div className="page-title-group">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="header-right">
        <form
          className="global-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search ticket, serial, QR..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-icon" title="Quick Restock" onClick={onOpenRestock}>
            <PackagePlus size={18} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenNewPart}>
            <Plus size={16} /> New Part SKU
          </button>
        </div>
      </div>
    </header>
  );
};
