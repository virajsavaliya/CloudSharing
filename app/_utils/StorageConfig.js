export const STORAGE_PLANS = {
  FREE: {
    maxStorage: 200 * 1024 * 1024, // 200 MB in bytes
    fileRetentionDays: 7, // Days before automatic deletion
    recycleBinRetentionDays: 3, // Days in recycle bin
    name: 'Free'
  },
  Pro: {
    maxStorage: 2 * 1024 * 1024 * 1024, // 2 GB in bytes
    fileRetentionDays: 30, // Days before automatic deletion
    recycleBinRetentionDays: 14, // Days in recycle bin
    name: 'Pro'
  },
  Premium: {
    maxStorage: 5 * 1024 * 1024 * 1024, // 5 GB in bytes
    fileRetentionDays: null, // No limit
    recycleBinRetentionDays: 30, // Days in recycle bin
    name: 'Premium'
  },
  // Backwards compatibility
  FREE: {
    maxStorage: 200 * 1024 * 1024,
    fileRetentionDays: 7,
    recycleBinRetentionDays: 3,
    name: 'Free'
  },
  PRO: {
    maxStorage: 2 * 1024 * 1024 * 1024,
    fileRetentionDays: 30,
    recycleBinRetentionDays: 14,
    name: 'Pro'
  },
  PREMIUM: {
    maxStorage: 5 * 1024 * 1024 * 1024,
    fileRetentionDays: null,
    recycleBinRetentionDays: 30,
    name: 'Premium'
  }
};

// Utility function to format bytes to human readable format
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get expiration date based on user plan and file type (regular or deleted)
export const getExpirationDate = (userPlan, isDeleted = false) => {
  const plan = STORAGE_PLANS[userPlan];
  if (!plan) return null;

  const now = new Date();
  const retentionDays = isDeleted ? 
    plan.recycleBinRetentionDays : 
    plan.fileRetentionDays;

  // If retention days is null (Premium plan regular files), return null
  if (retentionDays === null) return null;

  // Add retention days to current date
  return new Date(now.setDate(now.getDate() + retentionDays));
};

// Check if user has enough storage space
export const hasStorageSpace = (userPlan, currentUsage, newFileSize) => {
  const plan = STORAGE_PLANS[userPlan];
  if (!plan) return false;
  return (currentUsage + newFileSize) <= plan.maxStorage;
};