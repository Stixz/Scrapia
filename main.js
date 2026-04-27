const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = fs.readFileSync(windowStatePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading window state:', error);
  }
  return null;
}

function saveWindowState(bounds, isMaximized) {
  try {
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: isMaximized
    };
    fs.writeFileSync(windowStatePath, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving window state:', error);
  }
}

function createNotetakerWindow() {
  const savedState = loadWindowState();
  
  const windowOptions = {
    width: savedState ? savedState.width : 800,
    height: savedState ? savedState.height : 650,
    x: savedState && savedState.x !== undefined ? savedState.x : undefined,
    y: savedState && savedState.y !== undefined ? savedState.y : undefined,
    title: "Electron Notetaker",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false
  };

  const mainWindow = new BrowserWindow(windowOptions);

  if (savedState && savedState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadFile('index.html');

  // Listen for quit request from renderer process
  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  // Save window state on move and resize
  mainWindow.on('moved', () => {
    saveWindowState(mainWindow.getBounds(), mainWindow.isMaximized());
  });

  mainWindow.on('resized', () => {
    saveWindowState(mainWindow.getBounds(), mainWindow.isMaximized());
  });

  mainWindow.on('maximize', () => {
    saveWindowState(mainWindow.getBounds(), true);
  });

  mainWindow.on('unmaximize', () => {
    saveWindowState(mainWindow.getBounds(), false);
  });

  // Save window state before closing
  mainWindow.on('close', () => {
    saveWindowState(mainWindow.getBounds(), mainWindow.isMaximized());
  });

  // Handle save notes to file
  ipcMain.handle('save-notes-to-file', async (event, notes) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'notes-backup.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (filePath) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
        return { success: true, path: filePath };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, cancelled: true };
  });

  // Handle load notes from file
  ipcMain.handle('load-notes-from-file', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      try {
        const data = fs.readFileSync(filePaths[0], 'utf8');
        const notes = JSON.parse(data);
        return { success: true, notes: notes };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, cancelled: true };
  });

}

// Handle window-all-closed event for proper cleanup
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Electron app setup: run this when the window is ready
app.whenReady().then(createNotetakerWindow);

