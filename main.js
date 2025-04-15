// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const cp = require('node:child_process'); // Import child_process
const ffprobeStatic = require('ffprobe-static'); // Import ffprobe

// Async function to get video metadata using ffprobe
async function getVideoMetadata(filePath) {
  // ---> ADDED LOG: Check if function is entered
  console.log('[getVideoMetadata] Entered function.');
  // ---> ADDED LOG: Check the ffprobe path
  console.log(`[getVideoMetadata] ffprobe path: ${ffprobeStatic.path}`);

  console.log(`[getVideoMetadata] Probing metadata for: ${filePath}`);
  const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath];

  return new Promise((resolve, reject) => {
     // ---> ADDED LOG: Before executing ffprobe
    console.log('[getVideoMetadata] Executing ffprobe...');
    cp.execFile(ffprobeStatic.path, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => { // Increased maxBuffer just in case
       // ---> ADDED LOG: After ffprobe execution attempt
      console.log('[getVideoMetadata] ffprobe execution finished.');
      if (error) {
        console.error('[getVideoMetadata] ffprobe error:', error);
        console.error('[getVideoMetadata] ffprobe stderr:', stderr);
        return reject(error); // Reject the promise on error
      }
      try {
         // ---> ADDED LOG: Before parsing JSON
        console.log('[getVideoMetadata] Attempting to parse ffprobe output...');
        const output = JSON.parse(stdout);
        console.log('[getVideoMetadata] ffprobe successful, metadata extracted.');
        resolve(output); // Resolve the promise with the parsed output
      } catch (parseError) {
        console.error('[getVideoMetadata] Error parsing ffprobe JSON output:', parseError);
        console.error('[getVideoMetadata] ffprobe stdout (raw):', stdout); // Log raw output on parse error
        reject(parseError); // Reject the promise on parse error
      }
    });
  });
}


// Function to handle the file open dialog request AND get metadata
async function handleFileOpen() {
  console.log('[handleFileOpen] Main process received request to open file dialog.');
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || filePaths.length === 0) {
     console.log('[handleFileOpen] File selection canceled.');
     return null;
  }

  const filePath = filePaths[0];
  console.log('[handleFileOpen] File selected:', filePath);

  // ---> ADDED LOG: Before trying to get metadata
  console.log('[handleFileOpen] Attempting to get metadata...');
  try {
    // ---> ADDED LOG: Immediately before await
    console.log('[handleFileOpen] Calling await getVideoMetadata...');
    const metadata = await getVideoMetadata(filePath);
    // ---> ADDED LOG: Immediately after await (if successful)
    console.log('[handleFileOpen] getVideoMetadata call completed.');
    return { filePath, metadata };
  } catch (error) {
    // ---> MODIFIED LOG: More specific catch log
    console.error(`[handleFileOpen] Error caught while getting metadata for ${filePath}:`, error);
    // Return object indicating metadata failure but still provide path
    return { filePath, metadata: null };
  }
}

// --- createWindow, app.whenReady, etc. (remain the same) ---
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen);
  console.log('Registered IPC handler for dialog:openFile.');
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});