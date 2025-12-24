import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { filesAPI, foldersAPI, authAPI } from '../services/api';
import { downloadFile, sortItems } from '../utils/helpers';
import SideBar from '../components/SideBar';
import BreadCrumb from '../components/BreadCrumb';
import SearchBar from '../components/SearchBar';
import FileList from '../components/FileList';
import FileUpload from '../components/FileUpload';
import FilePreview from '../components/FilePreview';
import { 
  Upload, 
  RefreshCw,
  FolderPlus,
  AlertCircle
} from 'lucide-react';

const FileManager = () => {
  const { updateUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fileType: '',
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentFolderId, searchTerm, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching data for folder:', currentFolderId);
      
      const [filesResponse, foldersResponse, allFoldersResponse] = await Promise.all([
        filesAPI.getFiles({
          folderId: currentFolderId,
          search: searchTerm,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }),
        foldersAPI.getFolders(currentFolderId),
        foldersAPI.getFolderTree()
      ]);

      console.log('API responses:', { filesResponse, foldersResponse, allFoldersResponse });

      let fetchedFiles = filesResponse.data.files;
      let fetchedFolders = foldersResponse.data.folders;

      // Apply client-side filtering if needed
      if (filters.fileType) {
        fetchedFiles = fetchedFiles.filter(file => {
          // Implement file type filtering logic
          return true; // Simplified for now
        });
      }

      // Sort items
      fetchedFiles = sortItems(fetchedFiles, filters.sortBy, filters.sortOrder);
      fetchedFolders = sortItems(fetchedFolders, 'name', 'ASC');

      setFiles(fetchedFiles);
      setFolders(fetchedFolders);
      setAllFolders(allFoldersResponse.data.tree);
      
      console.log('Data set:', { files: fetchedFiles, folders: fetchedFolders });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load files and folders: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (folderId, path) => {
    setCurrentFolderId(folderId);
    setCurrentPath(path);
  };

  const handleFileAction = async (action, file) => {
    try {
      switch (action) {
        case 'download':
          const response = await filesAPI.downloadFile(file.id);
          downloadFile(response.data, file.original_name);
          break;

        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${file.original_name}"?`)) {
            await filesAPI.deleteFile(file.id);
            
            // Refresh user profile to get updated storage usage
            try {
              const profileResponse = await authAPI.getProfile();
              updateUser(profileResponse.data.user);
            } catch (profileError) {
              console.error('Error refreshing user profile:', profileError);
            }
            
            fetchData();
          }
          break;

        case 'rename':
          const newName = prompt('Enter new name:', file.original_name);
          if (newName && newName !== file.original_name) {
            await filesAPI.renameFile(file.id, newName);
            fetchData();
          }
          break;

        case 'preview':
          console.log('Opening preview for file:', file);
          setPreviewFile(file);
          setShowPreview(true);
          break;

        default:
          console.log('Unhandled file action:', action);
      }
    } catch (error) {
      console.error('File action error:', error);
      setError(error.response?.data?.error || 'Action failed');
    }
  };

  const handleFolderAction = async (action, folder) => {
    try {
      switch (action) {
        case 'open':
          handleFolderSelect(folder.id, folder.path);
          break;

        case 'delete':
          if (window.confirm(`Are you sure you want to delete folder "${folder.name}" and all its contents?`)) {
            await foldersAPI.deleteFolder(folder.id);
            fetchData();
          }
          break;

        case 'rename':
          const newName = prompt('Enter new name:', folder.name);
          if (newName && newName !== folder.name) {
            await foldersAPI.renameFolder(folder.id, newName);
            fetchData();
          }
          break;

        default:
          console.log('Unhandled folder action:', action);
      }
    } catch (error) {
      console.error('Folder action error:', error);
      setError(error.response?.data?.error || 'Action failed');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      console.log('Creating folder:', { name: newFolderName.trim(), parentId: currentFolderId });
      
      const response = await foldersAPI.createFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId
      });
      
      console.log('Folder created:', response.data);
      
      setNewFolderName('');
      setShowNewFolder(false);
      fetchData();
    } catch (error) {
      console.error('Create folder error:', error);
      setError(error.response?.data?.error || 'Failed to create folder: ' + error.message);
    }
  };

  const handleUploadComplete = (uploadedFiles) => {
    console.log('Upload completed:', uploadedFiles);
    fetchData();
    // Update user storage usage if needed
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SideBar
        currentFolderId={currentFolderId}
        onFolderSelect={handleFolderSelect}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">File Manager</h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewFolder(true)}
                className="btn-secondary px-3 py-2 text-sm"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </button>
              
              <button
                onClick={() => setShowUpload(true)}
                className="btn-primary px-3 py-2 text-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </button>
              
              <button
                onClick={fetchData}
                className="btn-secondary px-3 py-2 text-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <BreadCrumb
            path={currentPath}
            folders={allFolders}
            onNavigate={handleFolderSelect}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 p-4">
          <SearchBar
            onSearch={setSearchTerm}
            onFilterChange={setFilters}
            filters={filters}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-auto p-4">
          <FileList
            files={files}
            folders={folders}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onFileAction={handleFileAction}
            onFolderAction={handleFolderAction}
            loading={loading}
          />
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          currentFolderId={currentFolderId}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Folder</h2>
            
            <input
              type="text"
              placeholder="Folder name"
              className="input w-full mb-4"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
};

export default FileManager;