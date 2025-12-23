import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  Upload, 
  Settings, 
  LogOut, 
  User,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Files
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { foldersAPI } from '../services/api';
import { formatFileSize } from '../utils/helpers';

const SideBar = ({ currentFolderId, onFolderSelect, onUploadClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolderTree();
  }, []);

  const fetchFolderTree = async () => {
    try {
      const response = await foldersAPI.getFolderTree();
      setFolderTree(response.data.tree);
    } catch (error) {
      console.error('Error fetching folder tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (folders, level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <div
          className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
            currentFolderId === folder.id
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onFolderSelect(folder.id, folder.path)}
        >
          {folder.children && folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          
          {(!folder.children || folder.children.length === 0) && (
            <div className="w-4" /> // Spacer for alignment
          )}
          
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="truncate">{folder.name}</span>
        </div>
        
        {folder.children && 
         folder.children.length > 0 && 
         expandedFolders.has(folder.id) && (
          <div>
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const storagePercentage = (user.storage_used / user.storage_quota) * 100;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/files')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                location.pathname === '/files'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Files className="h-4 w-4" />
              <span>File Manager</span>
            </button>

            {location.pathname === '/files' && onUploadClick && (
              <button
                onClick={onUploadClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-4"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Files</span>
              </button>
            )}
          </div>

          {/* Folders - only show in File Manager */}
          {location.pathname === '/files' && (
            <div className="pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Folders
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="spinner h-4 w-4"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => onFolderSelect && onFolderSelect(null, '/')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentFolderId === null
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span>Root</span>
                  </button>
                  {renderFolderTree(folderTree)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <HardDrive className="h-4 w-4" />
            <span>Storage</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{formatFileSize(user.storage_used)}</span>
              <span>{formatFileSize(user.storage_quota)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  storagePercentage > 90 
                    ? 'bg-red-500' 
                    : storagePercentage > 70 
                    ? 'bg-yellow-500' 
                    : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500">
              {storagePercentage.toFixed(1)}% used
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;