import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { filesAPI, foldersAPI, authAPI } from '../services/api';
import { formatFileSize } from '../utils/helpers';
import SideBar from '../components/SideBar';
import { 
  Files, 
  FolderOpen, 
  HardDrive, 
  Upload,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    storageUsed: 0,
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [filesResponse, foldersResponse, profileResponse] = await Promise.all([
        filesAPI.getFiles({ all: 'true' }), // Get all files for the user
        foldersAPI.getFolders(null, { all: 'true' }), // Get all folders for the user
        authAPI.getProfile()
      ]);

      const files = filesResponse.data.files;
      const folders = foldersResponse.data.folders;
      const updatedUser = profileResponse.data.user;

      // Update user context with fresh data
      updateUser(updatedUser);

      // Get recent files (last 5)
      const recentFiles = files
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalFiles: files.length,
        totalFolders: folders.length,
        storageUsed: updatedUser.storage_used,
        recentFiles
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const storagePercentage = (user.storage_used / user.storage_quota) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user.username}!</h1>
                <p className="text-primary-100">Manage your files and folders efficiently</p>
              </div>
            </div>
          </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>
            <Files className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Folders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(stats.storageUsed)}
              </p>
              <p className="text-xs text-gray-500">
                of {formatFileSize(user.storage_quota)}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {storagePercentage.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Storage Usage Bar */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatFileSize(stats.storageUsed)} used</span>
            <span>{formatFileSize(user.storage_quota - stats.storageUsed)} available</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storagePercentage > 90 
                  ? 'bg-red-600' 
                  : storagePercentage > 70 
                  ? 'bg-yellow-600' 
                  : 'bg-primary-600'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Files</h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        
        {stats.recentFiles.length > 0 ? (
          <div className="space-y-3">
            {stats.recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Files className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.original_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No files uploaded yet</p>
            <p className="text-sm text-gray-400">Start by uploading your first file</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/files')}
            className="btn-primary p-4 text-left"
          >
            <Upload className="h-6 w-6 mb-2" />
            <div>
              <p className="font-medium">Upload Files</p>
              <p className="text-sm opacity-90">Add new files to your storage</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/files')}
            className="btn-secondary p-4 text-left"
          >
            <FolderOpen className="h-6 w-6 mb-2" />
            <div>
              <p className="font-medium">Create Folder</p>
              <p className="text-sm opacity-90">Organize your files</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/files')}
            className="btn-secondary p-4 text-left"
          >
            <Files className="h-6 w-6 mb-2" />
            <div>
              <p className="font-medium">Browse Files</p>
              <p className="text-sm opacity-90">View all your files</p>
            </div>
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;