import { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File as FileIcon
} from 'lucide-react';
import { filesAPI } from '../services/api';
import { formatFileSize, getFileType, downloadFile } from '../utils/helpers';

const FilePreview = ({ file, isOpen, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && file) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, file]);

  const loadPreview = async () => {
    if (!file) return;

    const fileType = getFileType(file.mime_type, file.original_name);
    
    // Only load preview for supported file types
    if (['image', 'text', 'pdf'].includes(fileType)) {
      setLoading(true);
      setError('');
      
      try {
        const response = await filesAPI.getFilePreview(file.id);
        const blob = new Blob([response.data], { type: file.mime_type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Error loading preview:', error);
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await filesAPI.downloadFile(file.id);
      downloadFile(response.data, file.original_name);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const renderPreview = () => {
    if (!file) return null;

    const fileType = getFileType(file.mime_type, file.original_name);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="spinner h-8 w-8"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>{error}</p>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return previewUrl ? (
          <div className="flex justify-center">
            <img
              src={previewUrl}
              alt={file.original_name}
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <ImageIcon className="h-16 w-16 text-gray-400" />
          </div>
        );

      case 'text':
        return previewUrl ? (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
            <iframe
              src={previewUrl}
              className="w-full h-80 border-0"
              title={file.original_name}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <FileText className="h-16 w-16 text-gray-400" />
          </div>
        );

      case 'pdf':
        return previewUrl ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <iframe
              src={previewUrl}
              className="w-full h-96 border-0 rounded"
              title={file.original_name}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <FileText className="h-16 w-16 text-gray-400" />
          </div>
        );

      case 'video':
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Video className="h-16 w-16 text-gray-400" />
            <p className="text-gray-600">Video preview not available</p>
            <p className="text-sm text-gray-500">Click download to view the video</p>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Music className="h-16 w-16 text-gray-400" />
            <p className="text-gray-600">Audio preview not available</p>
            <p className="text-sm text-gray-500">Click download to play the audio</p>
          </div>
        );

      case 'archive':
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Archive className="h-16 w-16 text-gray-400" />
            <p className="text-gray-600">Archive preview not available</p>
            <p className="text-sm text-gray-500">Click download to extract the archive</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <FileIcon className="h-16 w-16 text-gray-400" />
            <p className="text-gray-600">Preview not available</p>
            <p className="text-sm text-gray-500">Click download to view the file</p>
          </div>
        );
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {file.original_name}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{formatFileSize(file.file_size)}</span>
              <span>•</span>
              <span>{file.mime_type}</span>
              <span>•</span>
              <span>{new Date(file.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDownload}
              className="btn-primary px-4 py-2 text-sm"
              title="Download file"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              title="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>File Preview</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Close
            </button>
            
            <button
              onClick={handleDownload}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;