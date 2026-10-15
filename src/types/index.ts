export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';

export interface Snapshot {
  id: string;
  originalPath: string;
  fileName: string;
  fileExt: string;
  fileSize: number;
  sha256: string;
  timestamp: number; // ISO timestamp ms
  versionIndex: number; // 1, 2, 3...
  category: FileCategory;
  vaultRelativePath: string;
  originalExists: boolean;
  changeDescription?: string;
}

export interface FileHistoryGroup {
  originalPath: string;
  fileName: string;
  category: FileCategory;
  versions: Snapshot[];
  currentOriginalExists: boolean;
  lastModified: number;
}

export interface VaultStats {
  totalSnapshots: number;
  uniqueFiles: number;
  totalVaultSizeBytes: number;
  storageWarningConfirmed: boolean;
  vaultDirectory: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: string;
}

export interface RestoreOptions {
  snapshotId: string;
  targetMode: 'overwrite_original' | 'save_as' | 'desktop';
  customDestinationPath?: string;
}
