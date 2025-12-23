// Format file size in human readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date in human readable format
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Get file extension from filename
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Get file type category based on mime type or extension
export const getFileType = (mimeType, filename) => {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('xml')) return 'text';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  }

  const extension = getFileExtension(filename).toLowerCase();
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
  const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php'];
  const archiveExts = ['zip', 'rar', 'tar', 'gz', '7z'];

  if (imageExts.includes(extension)) return 'image';
  if (videoExts.includes(extension)) return 'video';
  if (audioExts.includes(extension)) return 'audio';
  if (extension === 'pdf') return 'pdf';
  if (textExts.includes(extension) || codeExts.includes(extension)) return 'text';
  if (archiveExts.includes(extension)) return 'archive';

  return 'file';
};

// Get file icon based on type
export const getFileIcon = (type) => {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    pdf: '📄',
    text: '📝',
    archive: '📦',
    folder: '📁',
    file: '📄'
  };
  
  return icons[type] || icons.file;
};

// Validate file types for upload
export const validateFileType = (file, allowedTypes = []) => {
  if (allowedTypes.length === 0) return true;
  
  const fileType = getFileType(file.type, file.name);
  return allowedTypes.includes(fileType);
};

// Generate breadcrumb path from folder path
export const generateBreadcrumbs = (path, folders = []) => {
  if (!path || path === '/') {
    return [{ name: 'Home', path: '/', id: null }];
  }

  const pathParts = path.split('/').filter(part => part);
  const breadcrumbs = [{ name: 'Home', path: '/', id: null }];

  let currentPath = '';
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const folder = folders.find(f => f.path === currentPath);
    breadcrumbs.push({
      name: part,
      path: currentPath,
      id: folder?.id || null
    });
  });

  return breadcrumbs;
};

// Download file helper
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Check if file can be previewed
export const canPreviewFile = (mimeType, filename) => {
  const type = getFileType(mimeType, filename);
  return ['image', 'text', 'pdf'].includes(type);
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Sort files and folders
export const sortItems = (items, sortBy, sortOrder) => {
  return [...items].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle different data types
    if (sortBy === 'file_size' || sortBy === 'size') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortOrder === 'DESC') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
};