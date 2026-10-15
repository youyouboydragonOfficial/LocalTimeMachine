import React, { useState, useEffect } from 'react';
import { Snapshot } from '../types';
import { X, RotateCcw, HardDrive, History, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Download, Code, Play } from 'lucide-react';

interface FilePreviewModalProps {
  snapshot: Snapshot | null;
  allVersions: Snapshot[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (snapshot: Snapshot, mode: 'overwrite_original' | 'desktop' | 'save_as') => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  snapshot,
  allVersions,
  isOpen,
  onClose,
  onRestore,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(snapshot);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    setSelectedSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (selectedSnapshot && window.electronAPI && window.electronAPI.getPreviewData) {
      setLoadingPreview(true);
      window.electronAPI.getPreviewData(selectedSnapshot.id)
        .then((data) => {
          setPreviewData(data);
          setLoadingPreview(false);
        })
        .catch(() => {
          setPreviewData(null);
          setLoadingPreview(false);
        });
    } else {
      setPreviewData(null);
    }
  }, [selectedSnapshot]);

  if (!isOpen || !selectedSnapshot) return null;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="max-w-5xl w-full h-[85vh] bg-[#0a1122] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden neon-glow-cyan text-white">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e162c]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate max-w-md">{selectedSnapshot.fileName}</h3>
                <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  バージョン {selectedSnapshot.versionIndex}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                保存日時: {formatDate(selectedSnapshot.timestamp)} • サイズ: {formatBytes(selectedSnapshot.fileSize)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left is preview, Right is version timeline history */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Preview Area */}
          <div className="flex-1 bg-[#060a14] p-6 flex flex-col items-center justify-center overflow-auto border-b md:border-b-0 md:border-r border-slate-800 relative">
            {loadingPreview ? (
              <div className="text-center font-mono text-cyan-400 text-sm animate-pulse">
                安全区域から実体プレビューを読み込み中...
              </div>
            ) : previewData?.type === 'image' ? (
              <img
                src={previewData.dataUrl}
                alt={selectedSnapshot.fileName}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            ) : previewData?.type === 'video' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-400 shadow-lg">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedSnapshot.fileName}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">動画ファイル（安全区域内に完全保管されています）</p>
                </div>
              </div>
            ) : previewData?.type === 'text' ? (
              <div className="w-full h-full bg-[#0a0f1d] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-auto whitespace-pre leading-relaxed select-text">
                {previewData.content}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-cyan-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedSnapshot.fileName}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    バイナリ実体データは安全区域に完全に保護されています
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Version History & Recovery options */}
          <div className="w-full md:w-80 bg-[#0c1326] p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-cyan-400">
                <History className="w-4 h-4" />
                <span>全バージョン履歴 ({allVersions.length}世代)</span>
              </div>

              {/* Version History List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {allVersions.map((v) => {
                  const isSelected = v.id === selectedSnapshot.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedSnapshot(v)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                          : 'bg-[#101932] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#131f3e]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono mb-1">
                        <span className="font-bold text-cyan-300">バージョン {v.versionIndex}</span>
                        <span className="text-[10px] text-slate-400">{formatBytes(v.fileSize)}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">{formatDate(v.timestamp)}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-1">
                        SHA: {v.sha256.substring(0, 10)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recovery Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                復旧支援アクション
              </span>

              <button
                onClick={() => onRestore(selectedSnapshot, 'overwrite_original')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>このバージョンへ元通り上書き復元</span>
              </button>

              <button
                onClick={() => onRestore(selectedSnapshot, 'desktop')}
                className="w-full py-2.5 px-3 bg-[#131d35] hover:bg-[#182544] border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>デスクトップへ安全救出</span>
              </button>

              <button
                onClick={() => onRestore(selectedSnapshot, 'save_as')}
                className="w-full py-2.5 px-3 bg-[#131d35] hover:bg-[#182544] border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>別名・別フォルダーへ復元</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
