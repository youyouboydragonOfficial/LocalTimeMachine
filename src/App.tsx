import React, { useState, useEffect, useMemo } from 'react';
import { Snapshot, VaultStats, UpdateCheckResult, FileCategory } from './types';
import { TimeMachineHeader } from './components/TimeMachineHeader';
import { TimeSlider } from './components/TimeSlider';
import { SnapshotCard } from './components/SnapshotCard';
import { FilePreviewModal } from './components/FilePreviewModal';
import { WarningModal } from './components/WarningModal';
import { UpdateCheckerModal } from './components/UpdateCheckerModal';
import { UploadCloud, ShieldAlert, Sparkles, CheckCircle, AlertCircle, History, Clock } from 'lucide-react';

export default function App() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Time travel state
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial load
  const loadData = async () => {
    if (!window.electronAPI) {
      // Mock for browser dev mode
      setLoading(false);
      return;
    }

    try {
      const currentStats = await window.electronAPI.getStats();
      setStats(currentStats);

      // Check 2x storage warning confirmation
      if (!currentStats.storageWarningConfirmed) {
        setShowWarningModal(true);
      }

      const list = await window.electronAPI.getSnapshots();
      setSnapshots(list);

      // Check updates on startup
      try {
        const update = await window.electronAPI.checkForUpdates();
        if (update && update.hasUpdate) {
          setUpdateInfo(update);
          setShowUpdateModal(true);
        }
      } catch (err) {
        console.warn('Update check failed on startup:', err);
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute timestamp ranges
  const { minTimestamp, maxTimestamp, allTimestamps } = useMemo(() => {
    if (snapshots.length === 0) {
      const now = Date.now();
      return { minTimestamp: now - 86400000, maxTimestamp: now, allTimestamps: [] };
    }
    const timestamps = snapshots.map((s) => s.timestamp);
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    return {
      minTimestamp: min === max ? min - 3600000 : min,
      maxTimestamp: max,
      allTimestamps: timestamps.sort((a, b) => a - b),
    };
  }, [snapshots]);

  // Update current time to latest when new snapshot added
  useEffect(() => {
    if (snapshots.length > 0) {
      setCurrentTime(maxTimestamp);
    }
  }, [maxTimestamp, snapshots.length]);

  // Group snapshots by original path to determine version count and history
  const historyMap = useMemo(() => {
    const map = new Map<string, Snapshot[]>();
    for (const s of snapshots) {
      const existing = map.get(s.originalPath) || [];
      existing.push(s);
      map.set(s.originalPath, existing);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => b.timestamp - a.timestamp);
    }
    return map;
  }, [snapshots]);

  // Filter snapshots based on:
  // 1. Time Travel: Show snapshot at or before currentTime for each original file
  // 2. Category filter
  // 3. Search query
  const displayedSnapshots = useMemo(() => {
    const fileEntries: Snapshot[] = [];

    for (const [pathKey, versions] of historyMap.entries()) {
      // Find the latest snapshot that existed at or before currentTime
      const validAtTime = versions.filter((v) => v.timestamp <= currentTime);
      if (validAtTime.length > 0) {
        fileEntries.push(validAtTime[0]); // Most recent at that moment
      }
    }

    return fileEntries.filter((s) => {
      // Category
      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = s.fileName.toLowerCase().includes(q);
        const matchesExt = s.fileExt.toLowerCase().includes(q);
        const matchesHash = s.sha256.toLowerCase().includes(q);
        return matchesName || matchesExt || matchesHash;
      }
      return true;
    });
  }, [historyMap, currentTime, selectedCategory, searchQuery]);

  // Confirm 2x storage warning
  const handleConfirmWarning = async () => {
    if (window.electronAPI) {
      await window.electronAPI.confirmStorageWarning();
    }
    setShowWarningModal(false);
    showToast('容量2倍の安全保護設定が承認されました。安全区域へ保存可能です。', 'success');
  };

  // Add files to vault
  const handleAddFiles = async () => {
    if (!window.electronAPI) return;
    try {
      const filePaths = await window.electronAPI.openFileDialog();
      if (!filePaths || filePaths.length === 0) return;

      for (const p of filePaths) {
        const res = await window.electronAPI.createSnapshot(p);
        if (res.isIdentical) {
          showToast(`「${res.snapshot?.fileName}」は既に最新状態で安全保護されています`, 'info');
        } else if (res.success) {
          showToast(`「${res.snapshot?.fileName}」を安全区域に二重保存しました（v${res.snapshot?.versionIndex}）`, 'success');
        }
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'ファイルの保存に失敗しました', 'error');
    }
  };

  // Drag and Drop files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!window.electronAPI) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    for (const f of files) {
      // In electron, File object has path property
      const filePath = (f as any).path;
      if (filePath) {
        try {
          const res = await window.electronAPI.createSnapshot(filePath);
          if (res.isIdentical) {
            showToast(`「${res.snapshot?.fileName}」は変更がありません`, 'info');
          } else if (res.success) {
            showToast(`「${res.snapshot?.fileName}」を安全区域に複製保存しました（v${res.snapshot?.versionIndex}）`, 'success');
          }
        } catch (err: any) {
          showToast(err.message || '保存エラー', 'error');
        }
      }
    }
    await loadData();
  };

  // Restore snapshot
  const handleRestore = async (snapshot: Snapshot, mode: 'overwrite_original' | 'desktop' | 'save_as') => {
    if (!window.electronAPI) return;

    const confirmMsg =
      mode === 'overwrite_original'
        ? `ファイル「${snapshot.fileName}」をバージョン ${snapshot.versionIndex} の状態へ元通り上書き復元しますか？`
        : mode === 'desktop'
        ? `デスクトップに「[復旧済み]_v${snapshot.versionIndex}_${snapshot.fileName}」として安全救出しますか？`
        : `復旧先フォルダを指定して復元しますか？`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await window.electronAPI.restoreSnapshot({
        snapshotId: snapshot.id,
        targetMode: mode,
      });

      if (res.success) {
        showToast(res.message, 'success');
        await loadData();
      } else {
        showToast(res.message, 'info');
      }
    } catch (err: any) {
      showToast(err.message || '復元に失敗しました', 'error');
    }
  };

  // Manual Check for Updates
  const handleManualCheckUpdate = async () => {
    if (!window.electronAPI) return;
    try {
      const update = await window.electronAPI.checkForUpdates();
      setUpdateInfo(update);
      setShowUpdateModal(true);
    } catch (err) {
      showToast('更新の確認に失敗しました', 'error');
    }
  };

  // Show in explorer
  const handleShowInFolder = async (filePath: string) => {
    if (window.electronAPI) {
      const found = await window.electronAPI.showInFolder(filePath);
      if (!found) {
        showToast('元ファイルはエクスプローラーから既に削除されています。安全区域から復元してください。', 'info');
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <TimeMachineHeader
        stats={stats}
        onAddFiles={handleAddFiles}
        onCheckUpdate={handleManualCheckUpdate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Time Travel Slider */}
      {snapshots.length > 0 && (
        <TimeSlider
          minTimestamp={minTimestamp}
          maxTimestamp={maxTimestamp}
          currentTimestamp={currentTime}
          onTimeChange={setCurrentTime}
          snapshotTimestamps={allTimestamps}
          onResetToLatest={() => setCurrentTime(maxTimestamp)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center font-mono text-cyan-400 animate-pulse flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                <span>安全区域データをロード中...</span>
              </div>
            </div>
          ) : displayedSnapshots.length === 0 ? (
            /* Empty State */
            <div className="h-[60vh] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-[#0a0f1d]/40">
              <div className="w-20 h-20 rounded-3xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-5 shadow-xl shadow-cyan-500/10">
                <UploadCloud className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                ファイル・写真・動画をここにドラッグ＆ドロップ
              </h2>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
                ショートカットではなく実体バイナリをアプリ内の安全区域へ二重コピーし、
                誤上書きや完全削除からいつでも完全復旧できる最強のタイムマシンです。
              </p>
              <button
                onClick={handleAddFiles}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>ファイルを選択して安全保管を開始</span>
              </button>
            </div>
          ) : (
            /* Snapshot Grid */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">
                    時系列スナップショット一覧
                  </h3>
                  <span className="text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    {displayedSnapshots.length} 件
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  ※ファイル・写真・動画を画面内にドラッグ＆ドロップでも保存可能
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedSnapshots.map((snapshot) => {
                  const versions = historyMap.get(snapshot.originalPath) || [];
                  return (
                    <SnapshotCard
                      key={snapshot.id}
                      snapshot={snapshot}
                      versionCount={versions.length}
                      onPreview={(s) => setPreviewSnapshot(s)}
                      onRestore={handleRestore}
                      onShowInFolder={handleShowInFolder}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Preview & Version History Modal */}
      {previewSnapshot && (
        <FilePreviewModal
          snapshot={previewSnapshot}
          allVersions={historyMap.get(previewSnapshot.originalPath) || [previewSnapshot]}
          isOpen={!!previewSnapshot}
          onClose={() => setPreviewSnapshot(null)}
          onRestore={(s, mode) => {
            handleRestore(s, mode);
            setPreviewSnapshot(null);
          }}
        />
      )}

      {/* 2x Storage Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onConfirm={handleConfirmWarning}
        vaultDirectory={stats?.vaultDirectory || 'C:\\Users\\...\\LocalTimeMachineSafeVault'}
      />

      {/* Startup / Manual Update Checker Modal */}
      <UpdateCheckerModal
        updateInfo={updateInfo}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-mono font-medium backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/70 text-rose-200'
              : 'bg-cyan-950/90 border-cyan-500/70 text-cyan-200'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
