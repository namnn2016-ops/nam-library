const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;

function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'nam-libary.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Connected to SQLite database at', dbPath);
      // Initialize tables if not exist
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS readers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          dob TEXT,
          email TEXT,
          avatar TEXT,
          expiry_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          owner TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS borrow_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL,
          reader_id TEXT NOT NULL,
          borrow_date TEXT NOT NULL,
          due_date TEXT NOT NULL,
          return_date TEXT,
          status TEXT DEFAULT 'BORROWED'
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )`);
      });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

  // Remove menu for cleaner look
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Database Operations
ipcMain.handle('db:query', (event, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db:run', (event, query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
});
