import { useState } from 'react';
import { 
  File, 
  Folder, 
  MoreVertical, 
  Download,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { formatFileSize, formatDate, getFileType, getFileIcon } from '../utils/helpers';
import ContextMenu from './ContextMenu';

const FileList = ({ 
  files = [], 
  folders = [], 
  viewMode = 'grid', 
  onViewModeChange,
  onFileAction,
  onFolderAction,
  loading = false 
}) => {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
    itemType: null
  });

  const handleContextMenu = (e, item, itemType) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      item,
      itemType
    });
  };

  const handleAction = (action, item) => {
    if (contextMenu.itemType === 'file') {
      onFileAction(action, item);
    } else if (contextMenu.itemType === 'folder') {
      onFolderAction(action, item);
    }
  };

  const handleItemClick = (item, itemType) => {
    if (itemType === 'folder') {
      onFolderAction('open', item);
    } else if (itemType === 'file') {
      onFileAction('preview', item);
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={`folder-${folder.id}`}
          className="group cursor-pointer"
          onClick={() => handleItemClick(folder, 'folder')}
          onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
        >
          <div className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <Folder className="h-12 w-12 text-blue-500 mb-2" />
              <p className="text-sm font-medium text-gray-900 truncate w-full">
                {folder.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(folder.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Files */}
      {files.map((file) => {
        const fileType = getFileType(file.mime_type, file.original_name);
        const icon = getFileIcon(fileType);
        
        return (
          <div
            key={`file-${file.id}`}
            className="group cursor-pointer"
            onClick={() => handleItemClick(file, 'file')}
            onContextMenu={(e) => handleContextMenu(e, file, 'file')}
          >
            <div className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                {fileType === 'image' ? (
                  <div className="w-12 h-12 mb-2 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={`http://localhost:5000/api/files/${file.id}/preview`}
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <File className="h-8 w-8 text-gray-400 hidden" />
                  </div>
                ) : (
                  <div className="text-2xl mb-2">{icon}</div>
                )}
                
                <p className="text-sm font-medium text-gray-900 truncate w-full">
                  {file.original_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.file_size)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(file.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modified
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Folders */}
          {folders.map((folder) => (
            <tr
              key={`folder-${folder.id}`}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleItemClick(folder, 'folder')}
              onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Folder className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    {folder.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                —
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(folder.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, folder, 'folder');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}

          {/* Files */}
          {files.map((file) => {
            const fileType = getFileType(file.mime_type, file.original_name);
            const icon = getFileIcon(fileType);
            
            return (
              <tr
                key={`file-${file.id}`}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleItemClick(file, 'file')}
                onContextMenu={(e) => handleContextMenu(e, file, 'file')}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{icon}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {file.original_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.file_size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileAction('preview', file);
                      }}
                      className="text-gray-400 hover:text-primary-600"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileAction('download', file);
                      }}
                      className="text-gray-400 hover:text-primary-600"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, file, 'file');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files or folders</h3>
        <p className="text-gray-500">This folder is empty. Upload files or create folders to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid' 
                ? 'bg-white shadow text-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded ${
              viewMode === 'list' 
                ? 'bg-white shadow text-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        item={contextMenu.item}
        itemType={contextMenu.itemType}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAction={handleAction}
      />
    </div>
  );
};

export default FileList;