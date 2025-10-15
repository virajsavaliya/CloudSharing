export const getFileIcon = (file) => {
  // Handle both file objects and direct fileType strings
  const fileType = typeof file === 'string' ? file : file?.fileType;

  // Handle folders
  if (file?.type === 'folder') return '/icons/folder.svg';

  // If no valid fileType, return default
  if (!fileType || typeof fileType !== 'string') return '/icons/file.svg';

  // Images
  if (fileType.includes('image/')) return '/icons/image.svg';
  
  // Videos
  if (fileType.includes('video/')) return '/icons/video.svg';
  
  // Audio
  if (fileType.includes('audio/')) return '/icons/audio.svg';

  // Documents
  if (fileType.includes('application/pdf')) return '/icons/pdf.svg';
  if (fileType.includes('application/msword') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return '/icons/word.svg';
  }
  if (fileType.includes('application/vnd.ms-excel') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    return '/icons/excel.svg';
  }
  if (fileType.includes('application/vnd.ms-powerpoint') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
    return '/icons/powerpoint.svg';
  }

  // Archives
  if (fileType.includes('application/zip') || 
      fileType.includes('application/x-rar-compressed') ||
      fileType.includes('application/x-7z-compressed')) {
    return '/icons/archive.svg';
  }

  // Default
  return '/icons/file.svg';
};
