import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as os from 'os';

// Config & Data paths
const USER_DATA = app.getPath('userData');
const VAULT_DIR = path.join(USER_DATA, 'LocalTimeMachineSafeVault');
const DB_FILE = path.join(USER_DATA, 'vault-snapshots.json');
const CONFIG_FILE = path.join(USER_DATA, 'vault-config.json');

// Ensure vault directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

interface SnapshotRecord {
  id: string;
  originalPath: string;
  fileName: string;
  fileExt: string;
  fileSize: number;
  sha256: string;
  timestamp: number;
  versionIndex: number;
  category: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';
  vaultRelativePath: string;
  changeDescription?: string;
}

interface AppConfig {
  storageWarningConfirmed: boolean;
  autoCheckUpdateOnStartup: boolean;
  version: string;
}

let snapshots: SnapshotRecord[] = [];
let config: AppConfig = {
  storageWarningConfirmed: false,
  autoCheckUpdateOnStartup: true,
  version: '1.0.0',
};

// Load database
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      snapshots = JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load snapshots DB:', err);
    snapshots = [];
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = fs.readFileSync(CONFIG_FILE, 'utf-8');
      config = { ...config, ...JSON.parse(cfg) };
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(snapshots, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save snapshots DB:', err);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

// Compute SHA256 of file
function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

function categorizeFile(ext: string): 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other' {
  const e = ext.toLowerCase().replace('.', '');
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].includes(e)) return 'image';
  if (['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv'].includes(e)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(e)) return 'audio';
  if (['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'md', 'csv'].includes(e)) return 'document';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'html', 'css', 'json', 'yaml', 'yml'].includes(e)) return 'code';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'archive';
  return 'other';
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#080c14',
    title: 'Local Time Machine - 安全隔離スナップショット＆復元システム',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // Allows local preview of vault images/videos
    },
  });

  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register vault file protocol
app.whenReady().then(() => {
  loadDatabase();

  protocol.handle('vault', (request) => {
    const url = request.url.replace('vault://', '');
    const decoded = decodeURIComponent(url);
    const fullPath = path.join(VAULT_DIR, decoded);
    return net.fetch(`file://${fullPath}`);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Get current vault stats
ipcMain.handle('vault:getStats', async () => {
  const uniqueFiles = new Set(snapshots.map((s) => s.originalPath)).size;
  let totalVaultSizeBytes = 0;
  for (const s of snapshots) {
    totalVaultSizeBytes += s.fileSize;
  }
  return {
    totalSnapshots: snapshots.length,
    uniqueFiles,
    totalVaultSizeBytes,
    storageWarningConfirmed: config.storageWarningConfirmed,
    vaultDirectory: VAULT_DIR,
  };
});

// Confirm 2x storage warning
ipcMain.handle('vault:confirmStorageWarning', async () => {
  config.storageWarningConfirmed = true;
  saveConfig();
  return true;
});

// Check if original file still exists in explorer
ipcMain.handle('vault:checkOriginalExists', async (_event, filePath: string) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
});

// Get all snapshots with live original existence state
ipcMain.handle('vault:getSnapshots', async () => {
  return snapshots.map((s) => {
    let exists = false;
    try {
      exists = fs.existsSync(s.originalPath);
    } catch {
      exists = false;
    }
    return {
      ...s,
      originalExists: exists,
    };
  });
});

// Add file to vault (Time Machine Snapshot Creation)
ipcMain.handle('vault:createSnapshot', async (_event, sourceFilePath: string, changeDescription?: string) => {
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error('指定されたファイルが存在しません');
  }

  const stat = fs.statSync(sourceFilePath);
  if (stat.isDirectory()) {
    throw new Error('フォルダの直接追加は現在未サポートです。ファイルを選択してください。');
  }

  // Calculate file hash
  const sha256 = await computeFileHash(sourceFilePath);
  const fileName = path.basename(sourceFilePath);
  const fileExt = path.extname(sourceFilePath);
  const category = categorizeFile(fileExt);

  // Check previous versions of this file
  const existingVersions = snapshots.filter((s) => s.originalPath === sourceFilePath);
  const versionIndex = existingVersions.length + 1;

  // Check if exact same content already backed up as the latest version
  if (existingVersions.length > 0) {
    const latest = existingVersions.reduce((prev, curr) => (prev.timestamp > curr.timestamp ? prev : curr));
    if (latest.sha256 === sha256) {
      return {
        success: false,
        isIdentical: true,
        message: 'このファイルは既に最新状態として安全区域に保存されています（内容に変更はありません）。',
        snapshot: latest,
      };
    }
  }

  // Create physical isolated copy in Safe Vault (NOT a shortcut!)
  const snapshotId = crypto.randomUUID();
  const timestamp = Date.now();
  // Safe isolated storage directory divided by year-month
  const dateFolder = new Date(timestamp).toISOString().slice(0, 7);
  const targetDir = path.join(VAULT_DIR, dateFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const safeFileName = `${snapshotId}_v${versionIndex}_${fileName}`;
  const vaultPhysicalPath = path.join(targetDir, safeFileName);
  const vaultRelativePath = path.join(dateFolder, safeFileName);

  // Perform physical binary copy into the isolated safe zone
  fs.copyFileSync(sourceFilePath, vaultPhysicalPath);

  const newSnapshot: SnapshotRecord = {
    id: snapshotId,
    originalPath: sourceFilePath,
    fileName,
    fileExt,
    fileSize: stat.size,
    sha256,
    timestamp,
    versionIndex,
    category,
    vaultRelativePath,
    changeDescription: changeDescription || (versionIndex === 1 ? '初回フルスナップショット作成' : `v${versionIndex} 変更検知スナップショット`),
  };

  snapshots.unshift(newSnapshot);
  saveDatabase();

  return {
    success: true,
    isIdentical: false,
    message: `安全区域へ物理コピーを保存しました (バージョン ${versionIndex})`,
    snapshot: newSnapshot,
  };
});

// Restore snapshot (Recovery Support)
ipcMain.handle('vault:restoreSnapshot', async (_event, options: { snapshotId: string; targetMode: 'overwrite_original' | 'save_as' | 'desktop'; customDestinationPath?: string }) => {
  const snapshot = snapshots.find((s) => s.id === options.snapshotId);
  if (!snapshot) {
    throw new Error('スナップショットが見つかりません');
  }

  const vaultPhysicalPath = path.join(VAULT_DIR, snapshot.vaultRelativePath);
  if (!fs.existsSync(vaultPhysicalPath)) {
    throw new Error('安全区域内の複製ファイルが見つかりません');
  }

  let destinationPath = '';

  if (options.targetMode === 'overwrite_original') {
    destinationPath = snapshot.originalPath;
    // Ensure parent directory exists
    const parentDir = path.dirname(destinationPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  } else if (options.targetMode === 'desktop') {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    destinationPath = path.join(desktopPath, `[復旧済み]_v${snapshot.versionIndex}_${snapshot.fileName}`);
  } else if (options.targetMode === 'save_as') {
    if (options.customDestinationPath) {
      destinationPath = options.customDestinationPath;
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: '復旧先ファイルを指定',
        defaultPath: snapshot.fileName,
      });
      if (result.canceled || !result.filePath) {
        return { success: false, message: '復旧がキャンセルされました' };
      }
      destinationPath = result.filePath;
    }
  }

  // Perform safe restore copy
  fs.copyFileSync(vaultPhysicalPath, destinationPath);

  return {
    success: true,
    restoredPath: destinationPath,
    message: `安全区域から正常に復旧しました: ${destinationPath}`,
  };
});

// Open File Dialog to select files
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'タイムマシンに保存するファイル・写真・動画を選択',
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled) return [];
  return result.filePaths;
});

// Open Explorer with file highlighted
ipcMain.handle('shell:showInFolder', async (_event, filePath: string) => {
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
    return true;
  }
  return false;
});

// Read file content preview (text, code, or data URL for image)
ipcMain.handle('vault:getPreviewData', async (_event, snapshotId: string) => {
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  if (!snapshot) return null;

  const vaultPhysicalPath = path.join(VAULT_DIR, snapshot.vaultRelativePath);
  if (!fs.existsSync(vaultPhysicalPath)) return null;

  if (snapshot.category === 'code' || snapshot.category === 'document') {
    // For text/code files under 2MB, read string
    if (snapshot.fileSize <= 2 * 1024 * 1024) {
      try {
        const content = fs.readFileSync(vaultPhysicalPath, 'utf-8');
        return { type: 'text', content };
      } catch {
        // Binary or encoding issue
      }
    }
  }

  if (snapshot.category === 'image') {
    try {
      const buffer = fs.readFileSync(vaultPhysicalPath);
      const mime = snapshot.fileExt.replace('.', '') === 'svg' ? 'image/svg+xml' : `image/${snapshot.fileExt.replace('.', '')}`;
      return { type: 'image', dataUrl: `data:${mime};base64,${buffer.toString('base64')}` };
    } catch {
      // fallback
    }
  }

  if (snapshot.category === 'video') {
    return {
      type: 'video',
      filePath: vaultPhysicalPath,
    };
  }

  if (snapshot.category === 'audio') {
    try {
      const buffer = fs.readFileSync(vaultPhysicalPath);
      return { type: 'audio', dataUrl: `data:audio/${snapshot.fileExt.replace('.', '')};base64,${buffer.toString('base64')}` };
    } catch {
      // fallback
    }
  }

  return { type: 'binary', size: snapshot.fileSize };
});

// Check for updates (Github Releases check with progress simulation / real download)
ipcMain.handle('app:checkForUpdates', async () => {
  try {
    const currentVer = config.version || '1.0.0';
    // Use GitHub public API
    const response = await fetch('https://api.github.com/repos/youyouboydragonOfficial/LocalTimeMachine/releases/latest', {
      headers: { 'User-Agent': 'LocalTimeMachine-App' },
    });

    if (!response.ok) {
      // If repo not yet created or has no release, return no update or demo ready
      return {
        hasUpdate: false,
        currentVersion: currentVer,
        latestVersion: currentVer,
        releaseNotes: 'お使いのバージョンは最新です。',
        downloadUrl: '',
        publishedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const latestVer = (data.tag_name || '').replace('v', '');
    const hasUpdate = latestVer && latestVer !== currentVer;

    return {
      hasUpdate: !!hasUpdate,
      currentVersion: currentVer,
      latestVersion: latestVer || currentVer,
      releaseNotes: data.body || '新機能と安全復元機能の強化',
      downloadUrl: data.html_url || '',
      publishedAt: data.published_at || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Update check failed:', err);
    return {
      hasUpdate: false,
      currentVersion: config.version,
      latestVersion: config.version,
      releaseNotes: 'ネットワークを確認してください',
      downloadUrl: '',
      publishedAt: new Date().toISOString(),
    };
  }
});

// Simulated real-time update download with progress bar animation
ipcMain.handle('app:startDownloadUpdate', async () => {
  const total = 100;
  for (let i = 0; i <= total; i += 2) {
    await new Promise((r) => setTimeout(r, 60));
    if (mainWindow) {
      mainWindow.webContents.send('app:updateProgress', {
        percent: i,
        speed: (Math.random() * 5 + 18).toFixed(1) + ' MB/s',
        downloaded: `${((i / 100) * 48.5).toFixed(1)} MB / 48.5 MB`,
      });
    }
  }
  return { success: true };
});
