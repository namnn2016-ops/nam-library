export interface DriveInfo {
  letter: string;
  path: string;
  label: string;
  isCloud?: boolean;
}

export interface CloudFolderInfo {
  id: string;
  name: string;
  baseDir: string;
  path: string;
  label: string;
  isCloud: boolean;
  isRecommended: boolean;
  description: string;
}

export interface StorageConfig {
  dataDir: string;
  isConfigured: boolean;
  currentUserId: string | null;
  drives?: DriveInfo[];
  cloudFolders?: CloudFolderInfo[];
  isCloudSync?: boolean;
  activeDbPath?: string | null;
}

export interface ElectronAPI {
  isElectron: boolean;
  dbQuery: <T = unknown>(query: string, params?: unknown[]) => Promise<T[]>;
  dbRun: (query: string, params?: unknown[]) => Promise<{ lastID?: number; changes?: number }>;
  dbClear: () => Promise<{ success: boolean }>;
  initUserDb: (userId: string) => Promise<{ success: boolean; dbPath: string; userId: string }>;
  getStorageConfig: () => Promise<StorageConfig>;
  setStorageDirectory: (newDir: string) => Promise<{ success: boolean; dataDir: string; isCloudSync?: boolean }>;
  selectDirectory: () => Promise<{ success: boolean; dataDir: string; activeDbPath: string; isCloudSync?: boolean } | null>;
  getAvailableDrives: () => Promise<DriveInfo[]>;
  getCloudFolders: () => Promise<CloudFolderInfo[]>;
  openStorageFolder: () => Promise<boolean>;
  exportBackup: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; message?: string }>;
  importBackup: () => Promise<{ success: boolean; targetDbPath?: string; canceled?: boolean; message?: string }>;
  openExternal: (url: string) => Promise<boolean>;
  sendEmail: (payload: {
    to: string | string[];
    subject: string;
    html: string;
    apiKey?: string;
    fromEmail?: string;
  }) => Promise<{ success: boolean; message: string }>;
  getEmailStatus: (customKey?: string) => Promise<{
    isConfigured: boolean;
    fromEmail: string;
    maskedKey: string;
    hasEnvKey: boolean;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
