import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { filesAPI } from '../services/api';
import { formatFileSize } from '../utils/helpers';

const FileUpload = ({ currentFolderId, onUploadComplete, onClose }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      
      files.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const response = await filesAPI.uploadFiles(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress({ overall: progress });
      });

      if (response.data) {
        onUploadComplete(response.data.files);
        setFiles([]);
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Support for multiple files. Maximum 100MB per file.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Selected Files ({files.length})
              </h3>
              <p className="text-sm text-gray-500">
                Total: {formatFileSize(totalSize)}
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {files.map((fileObj) => (
                <div
                  key={fileObj.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{fileObj.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileObj.size)}
                      </p>
                    </div>
                  </div>
                  
                  {!uploading && (
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && uploadProgress.overall !== undefined && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-500">{uploadProgress.overall}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.overall}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            {uploading ? (
              <div className="flex items-center">
                <div className="spinner h-4 w-4 mr-2"></div>
                Uploading...
              </div>
            ) : (
              `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;