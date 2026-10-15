import { contextBridge, ipcRenderer } from 'electron';
import { Snapshot, VaultStats, UpdateCheckResult, RestoreOptions } from '../src/types';

export const api = {
  getStats: (): Promise<VaultStats> => ipcRenderer.invoke('vault:getStats'),
  confirmStorageWarning: (): Promise<boolean> => ipcRenderer.invoke('vault:confirmStorageWarning'),
  getSnapshots: (): Promise<Snapshot[]> => ipcRenderer.invoke('vault:getSnapshots'),
  createSnapshot: (sourceFilePath: string, note?: string): Promise<{ success: boolean; isIdentical: boolean; message: string; snapshot?: Snapshot }> =>
    ipcRenderer.invoke('vault:createSnapshot', sourceFilePath, note),
  restoreSnapshot: (options: RestoreOptions): Promise<{ success: boolean; restoredPath?: string; message: string }> =>
    ipcRenderer.invoke('vault:restoreSnapshot', options),
  openFileDialog: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles'),
  showInFolder: (filePath: string): Promise<boolean> => ipcRenderer.invoke('shell:showInFolder', filePath),
  getPreviewData: (snapshotId: string): Promise<any> => ipcRenderer.invoke('vault:getPreviewData', snapshotId),
  checkForUpdates: (): Promise<UpdateCheckResult> => ipcRenderer.invoke('app:checkForUpdates'),
  startDownloadUpdate: (): Promise<{ success: boolean }> => ipcRenderer.invoke('app:startDownloadUpdate'),
  onUpdateProgress: (callback: (data: { percent: number; speed: string; downloaded: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('app:updateProgress', handler);
    return () => ipcRenderer.removeListener('app:updateProgress', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: typeof api;
  }
}
