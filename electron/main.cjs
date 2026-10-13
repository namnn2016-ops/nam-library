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

function getAvailableDrives() {
  const drives = [];
  const letters = ['C', 'D', 'E', 'F', 'G', 'H', 'Z'];
  for (const letter of letters) {
    const rootPath = `${letter}:\\`;
    try {
      if (fs.existsSync(rootPath)) {
        drives.push({
          letter: `${letter}:`,
          path: path.join(`${letter}:\\`, 'NamLibraryData'),
          label: `Ổ đĩa ${letter}: (${letter}:\\NamLibraryData)`
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
        currentUserId: data.currentUserId || null
      };
    }
  } catch (e) {
    console.error('Lỗi đọc cấu hình storage:', e);
  }

  // Mặc định: Ưu tiên ổ D nếu có, không thì ổ C, hoặc thư mục userData
  const drives = getAvailableDrives();
  const dDrive = drives.find((d) => d.letter === 'D:');
  const defaultDir = dDrive
    ? dDrive.path
    : drives[0]
    ? drives[0].path
    : path.join(app.getPath('userData'), 'NamLibraryData');

  return {
    dataDir: defaultDir,
    isConfigured: false,
    currentUserId: null
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../public/logo-icon.svg')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Remove menu for cleaner modern desktop look
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  const config = getStorageConfig();
  await switchUserDb(config.currentUserId || 'default_user');
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

// IPC Handlers: Storage & Drives
ipcMain.handle('storage:get-config', () => {
  const config = getStorageConfig();
  const drives = getAvailableDrives();
  return {
    ...config,
    drives,
    activeDbPath: currentDb
      ? path.join(config.dataDir, 'users', currentUserId, 'library.db')
      : null
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
  return { success: true, dataDir: newDir };
});

ipcMain.handle('storage:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn thư mục hoặc ổ đĩa để lưu trữ cơ sở dữ liệu',
    properties: ['openDirectory', 'createDirectory']
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
    activeDbPath: path.join(selectedPath, 'users', currentUserId, 'library.db')
  };
});

ipcMain.handle('storage:get-drives', () => {
  return getAvailableDrives();
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
