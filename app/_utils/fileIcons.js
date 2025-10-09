export const getFileIcon = (file) => {
  // Handle both file objects and direct fileType strings
  const fileType = typeof file === 'string' ? file : file?.fileType;

  // Handle folders
  if (file?.type === 'folder') return '/public/icons/folder.svg';

  // If no valid fileType, return default
  if (!fileType || typeof fileType !== 'string') return '/public/icons/file.svg';

  // Images
  if (fileType.includes('image/')) return '/public/icons/image.svg';
  
  // Videos
  if (fileType.includes('video/')) return '/public/icons/video.svg';
  
  // Audio
  if (fileType.includes('audio/')) return '/public/icons/audio.svg';

  // Documents
  if (fileType.includes('application/pdf')) return '/public/icons/pdf.svg';
  if (fileType.includes('application/msword') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return '/public/icons/word.svg';
  }
  if (fileType.includes('application/vnd.ms-excel') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    return '/public/icons/excel.svg';
  }
  if (fileType.includes('application/vnd.ms-powerpoint') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
    return '/public/icons/powerpoint.svg';
  }

  // Archives
  if (fileType.includes('application/zip') || 
      fileType.includes('application/x-rar-compressed') ||
      fileType.includes('application/x-7z-compressed')) {
    return '/public/icons/archive.svg';
  }

  // Default
  return '/public/icons/file.svg';
};
