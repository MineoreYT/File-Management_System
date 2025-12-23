import React, { useEffect, useRef } from 'react';
import { 
  Download, 
  Edit3, 
  Trash2, 
  Move, 
  Copy, 
  Eye, 
  FolderPlus,
  Upload
} from 'lucide-react';

const ContextMenu = ({ 
  isOpen, 
  position, 
  onClose, 
  item, 
  itemType, // 'file', 'folder', or 'empty'
  onAction 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action) => {
    onAction(action, item);
    onClose();
  };

  const getMenuItems = () => {
    switch (itemType) {
      case 'file':
        return [
          { 
            icon: Eye, 
            label: 'Preview', 
            action: 'preview',
            disabled: !canPreview(item)
          },
          { 
            icon: Download, 
            label: 'Download', 
            action: 'download' 
          },
          { 
            icon: Edit3, 
            label: 'Rename', 
            action: 'rename' 
          },
          { 
            icon: Move, 
            label: 'Move', 
            action: 'move' 
          },
          { 
            icon: Copy, 
            label: 'Copy', 
            action: 'copy' 
          },
          { type: 'separator' },
          { 
            icon: Trash2, 
            label: 'Delete', 
            action: 'delete',
            className: 'text-red-600 hover:bg-red-50'
          }
        ];

      case 'folder':
        return [
          { 
            icon: FolderPlus, 
            label: 'Open', 
            action: 'open' 
          },
          { 
            icon: Edit3, 
            label: 'Rename', 
            action: 'rename' 
          },
          { 
            icon: Move, 
            label: 'Move', 
            action: 'move' 
          },
          { type: 'separator' },
          { 
            icon: Trash2, 
            label: 'Delete', 
            action: 'delete',
            className: 'text-red-600 hover:bg-red-50'
          }
        ];

      case 'empty':
        return [
          { 
            icon: Upload, 
            label: 'Upload Files', 
            action: 'upload' 
          },
          { 
            icon: FolderPlus, 
            label: 'New Folder', 
            action: 'newFolder' 
          }
        ];

      default:
        return [];
    }
  };

  const canPreview = (file) => {
    if (!file) return false;
    const previewableTypes = ['image', 'text', 'pdf'];
    // You can implement getFileType logic here or import it
    return true; // Simplified for now
  };

  const menuItems = getMenuItems();

  // Calculate menu position to keep it within viewport
  const getMenuStyle = () => {
    const menuWidth = 200;
    const menuHeight = menuItems.length * 40; // Approximate height
    
    let left = position.x;
    let top = position.y;

    // Adjust if menu would go off-screen
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    
    if (top + menuHeight > window.innerHeight) {
      top = window.innerHeight - menuHeight - 10;
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000
    };
  };

  return (
    <div
      ref={menuRef}
      className="dropdown-menu min-w-[200px]"
      style={getMenuStyle()}
    >
      {menuItems.map((menuItem, index) => {
        if (menuItem.type === 'separator') {
          return (
            <div key={index} className="border-t border-gray-200 my-1" />
          );
        }

        const Icon = menuItem.icon;
        
        return (
          <button
            key={index}
            onClick={() => handleAction(menuItem.action)}
            disabled={menuItem.disabled}
            className={`dropdown-item w-full ${menuItem.className || ''} ${
              menuItem.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Icon className="h-4 w-4 mr-3" />
            {menuItem.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;