export interface DriveInfo {
  letter: string;
  path: string;
  label: string;
}

export interface StorageConfig {
  dataDir: string;
  isConfigured: boolean;
  currentUserId: string | null;
  drives?: DriveInfo[];
  activeDbPath?: string | null;
}

export interface ElectronAPI {
  isElectron: boolean;
  dbQuery: <T = unknown>(query: string, params?: unknown[]) => Promise<T[]>;
  dbRun: (query: string, params?: unknown[]) => Promise<{ lastID?: number; changes?: number }>;
  dbClear: () => Promise<{ success: boolean }>;
  initUserDb: (userId: string) => Promise<{ success: boolean; dbPath: string; userId: string }>;
  getStorageConfig: () => Promise<StorageConfig>;
  setStorageDirectory: (newDir: string) => Promise<{ success: boolean; dataDir: string }>;
  selectDirectory: () => Promise<{ success: boolean; dataDir: string; activeDbPath: string } | null>;
  getAvailableDrives: () => Promise<DriveInfo[]>;
  openStorageFolder: () => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
