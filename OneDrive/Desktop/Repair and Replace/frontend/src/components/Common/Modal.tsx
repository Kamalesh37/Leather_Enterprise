import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
  isPrintable?: boolean;
  allowMaximize?: boolean;
  defaultMaximized?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  isPrintable = false,
  allowMaximize = true,
  defaultMaximized = false,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(defaultMaximized);

  useEffect(() => {
    setIsMaximized(defaultMaximized);
  }, [isOpen, defaultMaximized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = isMaximized
    ? 'modal-maximized'
    : size === 'full'
    ? 'modal-full'
    : size === 'xl'
    ? 'modal-xl'
    : size === 'lg'
    ? 'modal-lg'
    : '';

  return (
    <div
      className={`modal-backdrop ${isPrintable ? 'printable-active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-dialog ${sizeClass}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {allowMaximize && (
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsMaximized(!isMaximized)}
                aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
                title={isMaximized ? 'Restore standard size' : 'Expand full screen'}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close" title="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
