const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let currentDb = null;
let currentUserId = 'default_user';

// Cấu hình đường dẫn lưu trữ
const configFile = path.join(app.getPath('userData'), 'storage-config.json');

/**
 * Tự động dò tìm các thư mục Cloud Sync phổ biến trên Windows
 * (OneDrive, Google Drive, Dropbox) để hỗ trợ đồng bộ đa máy tính (Cách 2)
 */
function getDetectedCloudFolders() {
  const list = [];
  const userProfile = process.env.USERPROFILE || '';
  const seenPaths = new Set();

  // 1. Microsoft OneDrive (Cá nhân hoặc Doanh nghiệp/Trường học)
  const oneDriveCandidates = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial,
    path.join(userProfile, 'OneDrive'),
  ].filter(Boolean);

  for (const od of oneDriveCandidates) {
    try {
      if (fs.existsSync(od) && !seenPaths.has(od.toLowerCase())) {
        seenPaths.add(od.toLowerCase());
        list.push({
          id: 'onedrive',
          name: 'Microsoft OneDrive',
          baseDir: od,
          path: path.join(od, 'NamLibraryData'),
          label: `OneDrive (${path.join(od, 'NamLibraryData')})`,
          isCloud: true,
          isRecommended: true,
          description: 'Khuyên dùng: Tự động đồng bộ dữ liệu sang máy tính khác khi đăng nhập cùng tài khoản OneDrive',
        });
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Google Drive Desktop
  const gDriveCandidates = [
    'G:\\My Drive',
    'G:\\',
    path.join(userProfile, 'Google Drive'),
    path.join(userProfile, 'Google Drive', 'My Drive'),
  ];
  for (const gd of gDriveCandidates) {
    try {
      if (fs.existsSync(gd) && !seenPaths.has(gd.toLowerCase())) {
        seenPaths.add(gd.toLowerCase());
        list.push({
          id: 'gdrive',
          name: 'Google Drive',
          baseDir: gd,
          path: path.join(gd, 'NamLibraryData'),
          label: `Google Drive (${path.join(gd, 'NamLibraryData')})`,
          isCloud: true,
          isRecommended: true,
          description: 'Khuyên dùng: Tự động đồng bộ dữ liệu sang máy tính khác qua Google Drive',
        });
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Dropbox
  const dropboxCandidates = [path.join(userProfile, 'Dropbox')];
  for (const db of dropboxCandidates) {
    try {
      if (fs.existsSync(db) && !seenPaths.has(db.toLowerCase())) {
        seenPaths.add(db.toLowerCase());
        list.push({
          id: 'dropbox',
          name: 'Dropbox',
          baseDir: db,
          path: path.join(db, 'NamLibraryData'),
          label: `Dropbox (${path.join(db, 'NamLibraryData')})`,
          isCloud: true,
          isRecommended: true,
          description: 'Tự động đồng bộ dữ liệu sang máy tính khác qua Dropbox',
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return list;
}

/**
 * Kiểm tra xem thư mục hiện tại có nằm trong thư mục Cloud Sync không
 */
function isCloudSyncPath(dataDir) {
  if (!dataDir) return false;
  const clouds = getDetectedCloudFolders();
  const lower = dataDir.toLowerCase();
  return (
    clouds.some((c) => lower.startsWith(c.baseDir.toLowerCase())) ||
    lower.includes('onedrive') ||
    lower.includes('google drive') ||
    lower.includes('dropbox')
  );
}

/**
 * Quét các ổ đĩa cục bộ trên Windows (C:, D:, E:,...)
 */
function getAvailableDrives() {
  const drives = [];
  const letters = ['C', 'D', 'E', 'F', 'G', 'H', 'Z'];
  const userProfile = process.env.USERPROFILE || '';

  for (const letter of letters) {
    const rootPath = `${letter}:\\`;
    try {
      if (fs.existsSync(rootPath)) {
        // Với ổ C:, dùng C:\Users\<Username>\NamLibraryData để tránh bị Windows từ chối quyền Administrator
        const targetPath =
          letter === 'C' && userProfile
            ? path.join(userProfile, 'NamLibraryData')
            : path.join(`${letter}:\\`, 'NamLibraryData');

        drives.push({
          letter: `${letter}:`,
          path: targetPath,
          label:
            letter === 'C'
              ? `Ổ đĩa C: (${targetPath})`
              : `Ổ đĩa ${letter}: (${targetPath})`,
          isCloud: false,
        });
      }
    } catch (e) {
      // ignore
    }
  }
  return drives;
}

function getStorageConfig() {
  try {
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return {
        dataDir: data.dataDir,
        isConfigured: Boolean(data.isConfigured),
        currentUserId: data.currentUserId || null,
      };
    }
  } catch (e) {
    console.error('Lỗi đọc cấu hình storage:', e);
  }

  // Mặc định: Ưu tiên OneDrive nếu có (đồng bộ đa máy theo Cách 2)
  const cloudFolders = getDetectedCloudFolders();
  const localDrives = getAvailableDrives();

  let defaultDir = '';
  if (cloudFolders.length > 0) {
    defaultDir = cloudFolders[0].path; // Ưu tiên OneDrive/Google Drive
  } else {
    const dDrive = localDrives.find((d) => d.letter === 'D:');
    defaultDir = dDrive
      ? dDrive.path
      : localDrives[0]
      ? localDrives[0].path
      : path.join(app.getPath('userData'), 'NamLibraryData');
  }

  return {
    dataDir: defaultDir,
    isConfigured: false,
    currentUserId: null,
  };
}

function saveStorageConfig(config) {
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Lỗi ghi cấu hình storage:', e);
  }
}

function switchUserDb(userId) {
  return new Promise((resolve, reject) => {
    const config = getStorageConfig();
    const dataDir = config.dataDir;
    const safeUserId = (userId || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');

    const userDir = path.join(dataDir, 'users', safeUserId);
    try {
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
    } catch (err) {
      console.error('Lỗi tạo thư mục lưu trữ:', err);
      reject(err);
      return;
    }

    const dbPath = path.join(userDir, 'library.db');

    if (currentDb) {
      try {
        currentDb.close();
      } catch (e) {
        // ignore
      }
      currentDb = null;
    }

    currentDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Lỗi kết nối SQLite cho tài khoản:', safeUserId, err);
        reject(err);
        return;
      }

      currentUserId = safeUserId;
      console.log(`[SQLite] Đã kết nối CSDL riêng biệt của [${safeUserId}] tại:`, dbPath);

      currentDb.serialize(() => {
        // Tối ưu hóa SQLite cho Cloud Sync (OneDrive / Google Drive):
        // Bật chế độ WAL (Write-Ahead Logging) và busy_timeout để tránh lỗi khóa tệp khi OneDrive đang sync
        currentDb.run('PRAGMA journal_mode = WAL;');
        currentDb.run('PRAGMA busy_timeout = 5000;');
        currentDb.run('PRAGMA synchronous = NORMAL;');

        currentDb.run(`CREATE TABLE IF NOT EXISTS readers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          dob TEXT,
          email TEXT,
          avatar TEXT,
          expiry_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        currentDb.run(`CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          owner TEXT,
          status TEXT DEFAULT 'AVAILABLE',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        currentDb.run(`CREATE TABLE IF NOT EXISTS borrow_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL,
          reader_id TEXT NOT NULL,
          borrow_date TEXT NOT NULL,
          due_date TEXT NOT NULL,
          return_date TEXT,
          status TEXT DEFAULT 'BORROWED',
          renew_count INTEGER DEFAULT 0
        )`);

        currentDb.run(`CREATE TABLE IF NOT EXISTS app_settings (
          setting_key TEXT PRIMARY KEY,
          setting_value TEXT
        )`);

        currentDb.run(`CREATE TABLE IF NOT EXISTS email_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          record_id INTEGER,
          reader_id TEXT,
          reader_email TEXT,
          book_id TEXT,
          email_type TEXT,
          sent_date TEXT
        )`);

        resolve({ success: true, dbPath, userId: safeUserId });
      });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617', // Giữ nền tối màu, tránh tình trạng màn hình chớp trắng
    show: false, // Ẩn đến khi sẵn sàng hiển thị để tránh màn hình trắng
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: fs.existsSync(path.join(__dirname, '../public/logo-icon.svg'))
      ? path.join(__dirname, '../public/logo-icon.svg')
      : path.join(__dirname, '../dist/logo-icon.svg'),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Cho phép người dùng bấm F12 để mở DevTools kiểm tra lỗi nếu cần
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Electron] Lỗi nạp tệp giao diện:', indexPath, err);
      // Nếu loadFile lỗi, thử fallback mở DevTools để hiển thị lỗi
      mainWindow.show();
      mainWindow.webContents.openDevTools();
    });
  }

  // Remove menu for cleaner modern desktop look
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  try {
    const config = getStorageConfig();
    await switchUserDb(config.currentUserId || 'default_user');
  } catch (err) {
    console.error('[Electron] Khởi tạo CSDL ban đầu thất bại:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (currentDb) {
    try {
      currentDb.close();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers: Storage, Drives, Cloud Sync
ipcMain.handle('storage:get-config', () => {
  const config = getStorageConfig();
  const drives = getAvailableDrives();
  const cloudFolders = getDetectedCloudFolders();
  return {
    ...config,
    drives,
    cloudFolders,
    isCloudSync: isCloudSyncPath(config.dataDir),
    activeDbPath: currentDb
      ? path.join(config.dataDir, 'users', currentUserId, 'library.db')
      : null,
  };
});

ipcMain.handle('storage:set-directory', async (event, newDir) => {
  const config = getStorageConfig();
  config.dataDir = newDir;
  config.isConfigured = true;
  saveStorageConfig(config);

  if (currentUserId) {
    await switchUserDb(currentUserId);
  }
  return {
    success: true,
    dataDir: newDir,
    isCloudSync: isCloudSyncPath(newDir),
  };
});

ipcMain.handle('storage:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn thư mục hoặc ổ đĩa để lưu trữ cơ sở dữ liệu',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const config = getStorageConfig();
  config.dataDir = selectedPath;
  config.isConfigured = true;
  saveStorageConfig(config);

  if (currentUserId) {
    await switchUserDb(currentUserId);
  }

  return {
    success: true,
    dataDir: selectedPath,
    isCloudSync: isCloudSyncPath(selectedPath),
    activeDbPath: path.join(selectedPath, 'users', currentUserId, 'library.db'),
  };
});

ipcMain.handle('storage:get-drives', () => {
  return getAvailableDrives();
});

ipcMain.handle('storage:get-cloud-folders', () => {
  return getDetectedCloudFolders();
});

ipcMain.handle('storage:open-folder', () => {
  const config = getStorageConfig();
  const targetDir = currentUserId
    ? path.join(config.dataDir, 'users', currentUserId)
    : config.dataDir;

  if (fs.existsSync(targetDir)) {
    shell.openPath(targetDir);
  } else {
    shell.openPath(config.dataDir);
  }
  return true;
});

// IPC Handlers: Backup Export & Import (An toàn dữ liệu tuyệt đối)
ipcMain.handle('storage:export-backup', async () => {
  if (!currentDb || !mainWindow) {
    return { success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng.' };
  }

  const config = getStorageConfig();
  const safeUserId = (currentUserId || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sourceDbPath = path.join(config.dataDir, 'users', safeUserId, 'library.db');

  if (!fs.existsSync(sourceDbPath)) {
    return { success: false, message: 'Tệp CSDL không tồn tại trên đĩa.' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const saveDialogResult = await dialog.showSaveDialog(mainWindow, {
    title: 'Xuất tệp sao lưu dữ liệu thư viện',
    defaultPath: `nam-library-backup-${safeUserId}-${todayStr}.db`,
    filters: [
      { name: 'Tệp sao lưu SQLite (.db)', extensions: ['db'] },
      { name: 'Tất cả các tệp', extensions: ['*'] },
    ],
  });

  if (saveDialogResult.canceled || !saveDialogResult.filePath) {
    return { success: false, canceled: true };
  }

  try {
    // Ép ghi toàn bộ nhật ký WAL vào file chính
    await new Promise((resolve) => currentDb.run('PRAGMA wal_checkpoint(FULL);', resolve));
    fs.copyFileSync(sourceDbPath, saveDialogResult.filePath);
    return { success: true, filePath: saveDialogResult.filePath };
  } catch (err) {
    console.error('Lỗi xuất tệp sao lưu:', err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('storage:import-backup', async () => {
  if (!mainWindow) return { success: false };

  const openDialogResult = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn tệp sao lưu để khôi phục dữ liệu',
    filters: [
      { name: 'Tệp sao lưu CSDL (.db, .sqlite, .namlib)', extensions: ['db', 'sqlite', 'namlib'] },
      { name: 'Tất cả các tệp', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (openDialogResult.canceled || !openDialogResult.filePaths.length) {
    return { success: false, canceled: true };
  }

  const backupFilePath = openDialogResult.filePaths[0];
  const config = getStorageConfig();
  const safeUserId = (currentUserId || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const userDir = path.join(config.dataDir, 'users', safeUserId);
  const targetDbPath = path.join(userDir, 'library.db');

  try {
    if (currentDb) {
      try {
        currentDb.close();
      } catch (e) {}
      currentDb = null;
    }

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Ghi đè file backup vào vị trí CSDL
    fs.copyFileSync(backupFilePath, targetDbPath);

    // Mở lại kết nối CSDL và khởi tạo
    await switchUserDb(currentUserId);
    return { success: true, targetDbPath };
  } catch (err) {
    console.error('Lỗi khôi phục tệp sao lưu:', err);
    return { success: false, message: err.message };
  }
});

// IPC Handlers: Shell
ipcMain.handle('shell:open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

// IPC Handlers: Multi-Account Database Operations
ipcMain.handle('db:init-user', async (event, userId) => {
  const config = getStorageConfig();
  config.currentUserId = userId;
  saveStorageConfig(config);
  return await switchUserDb(userId);
});

ipcMain.handle('db:query', (event, query, params) => {
  return new Promise((resolve, reject) => {
    if (!currentDb) {
      reject(new Error('Cơ sở dữ liệu SQLite chưa được khởi tạo.'));
      return;
    }
    currentDb.all(query, params || [], (err, rows) => {
      if (err) {
        console.error('Lỗi thực thi SQLite query:', err, query, params);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
});

ipcMain.handle('db:run', (event, query, params) => {
  return new Promise((resolve, reject) => {
    if (!currentDb) {
      reject(new Error('Cơ sở dữ liệu SQLite chưa được khởi tạo.'));
      return;
    }
    currentDb.run(query, params || [], function (err) {
      if (err) {
        console.error('Lỗi thực thi SQLite run:', err, query, params);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
});

ipcMain.handle('db:clear', () => {
  return new Promise((resolve, reject) => {
    if (!currentDb) {
      reject(new Error('Cơ sở dữ liệu SQLite chưa được khởi tạo.'));
      return;
    }
    currentDb.serialize(() => {
      currentDb.run('DELETE FROM email_notifications');
      currentDb.run('DELETE FROM borrow_records');
      currentDb.run('DELETE FROM books');
      currentDb.run('DELETE FROM readers', (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  });
});
