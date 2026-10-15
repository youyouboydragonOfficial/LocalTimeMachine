import React from 'react';
import { Snapshot } from '../types';
import { FileText, Image, Video, Music, Code2, Archive, File, ShieldCheck, AlertCircle, RotateCcw, Eye, FolderOpen, History, HardDrive } from 'lucide-react';

interface SnapshotCardProps {
  snapshot: Snapshot;
  versionCount: number;
  onPreview: (snapshot: Snapshot) => void;
  onRestore: (snapshot: Snapshot, mode: 'overwrite_original' | 'desktop') => void;
  onShowInFolder: (path: string) => void;
}

export const SnapshotCard: React.FC<SnapshotCardProps> = ({
  snapshot,
  versionCount,
  onPreview,
  onRestore,
  onShowInFolder,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = () => {
    switch (snapshot.category) {
      case 'image':
        return <Image className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-amber-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-rose-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-4 flex flex-col justify-between border relative overflow-hidden group ${
      !snapshot.originalExists ? 'border-rose-500/50 bg-[#160e1d]/90' : 'border-slate-800'
    }`}>
      {/* Top badges */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex-shrink-0">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate max-w-[180px] group-hover:text-cyan-300 transition" title={snapshot.fileName}>
              {snapshot.fileName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
              <span>{formatBytes(snapshot.fileSize)}</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                v{snapshot.versionIndex}
              </span>
              {versionCount > 1 && (
                <span className="text-slate-400 flex items-center gap-0.5">
                  <History className="w-3 h-3" />
                  {versionCount}世代
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge: Original exists vs Deleted */}
        {snapshot.originalExists ? (
          <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
            <ShieldCheck className="w-3 h-3" />
            保護中
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            元ファイル消失 (復元可)
          </span>
        )}
      </div>

      {/* Snapshot metadata */}
      <div className="bg-[#0b101f] p-2.5 rounded-xl border border-slate-800/80 mb-3 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>保存日時:</span>
          <span className="text-slate-200">{formatDate(snapshot.timestamp)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>SHA-256:</span>
          <span className="text-cyan-400/90 truncate max-w-[140px]" title={snapshot.sha256}>
            {snapshot.sha256.substring(0, 12)}...
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate" title={snapshot.originalPath}>
          元パス: <span className="text-slate-300">{snapshot.originalPath}</span>
        </div>
      </div>

      {/* If original file was deleted from explorer, give a prominent alert banner */}
      {!snapshot.originalExists && (
        <div className="mb-3 p-2 bg-rose-950/40 border border-rose-500/40 rounded-lg text-[11px] text-rose-300 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>エクスプローラーから削除されましたが安全区域に完全コピーがあるため復活できます！</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={() => onPreview(snapshot)}
          className="flex-1 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>確認・履歴</span>
        </button>

        <button
          onClick={() => onRestore(snapshot, 'overwrite_original')}
          title="元の場所へ元通り復元"
          className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition transform active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>復元</span>
        </button>

        <button
          onClick={() => onRestore(snapshot, 'desktop')}
          title="デスクトップへ救出"
          className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition"
        >
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {snapshot.originalExists && (
          <button
            onClick={() => onShowInFolder(snapshot.originalPath)}
            title="元のフォルダをエクスプローラーで表示"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};
