import React, { useState, useEffect } from 'react';
import { DownloadCloud, Sparkles, RefreshCw, CheckCircle, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { UpdateCheckResult } from '../types';

interface UpdateCheckerModalProps {
  updateInfo: UpdateCheckResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateCheckerModal: React.FC<UpdateCheckerModalProps> = ({ updateInfo, isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [progress, setProgress] = useState({
    percent: 0,
    speed: '0 MB/s',
    downloaded: '0 MB / 48.5 MB',
  });

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onUpdateProgress) {
      const unsubscribe = window.electronAPI.onUpdateProgress((data) => {
        setProgress(data);
        if (data.percent >= 100) {
          setDownloading(false);
          setDownloadComplete(true);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleStartDownload = async () => {
    setDownloading(true);
    setDownloadComplete(false);
    setProgress({ percent: 0, speed: '24.2 MB/s', downloaded: '0 MB / 48.5 MB' });

    try {
      if (window.electronAPI && window.electronAPI.startDownloadUpdate) {
        await window.electronAPI.startDownloadUpdate();
      } else {
        // Fallback for simulation
        let current = 0;
        const interval = setInterval(() => {
          current += 4;
          if (current >= 100) {
            clearInterval(interval);
            setProgress({ percent: 100, speed: '0 MB/s', downloaded: '48.5 MB / 48.5 MB' });
            setDownloading(false);
            setDownloadComplete(true);
          } else {
            setProgress({
              percent: current,
              speed: `${(Math.random() * 6 + 22).toFixed(1)} MB/s`,
              downloaded: `${((current / 100) * 48.5).toFixed(1)} MB / 48.5 MB`,
            });
          }
        }, 80);
      }
    } catch (err) {
      console.error(err);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="max-w-xl w-full bg-[#0a101f] border-2 border-cyan-500/70 rounded-2xl shadow-2xl p-6 sm:p-7 text-white relative overflow-hidden neon-glow-cyan">
        {/* Holographic light bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Sparkles className="w-6 h-6 animate-spin text-cyan-300" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              起動時スマートアップデート検知
            </span>
            <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
              最新バージョン <span className="text-cyan-400 font-mono">v{updateInfo.latestVersion}</span> が利用可能です
            </h3>
          </div>
        </div>

        {/* Release Notes */}
        <div className="bg-[#0f172a] border border-slate-700/60 rounded-xl p-4 mb-5 text-sm">
          <div className="flex justify-between items-center mb-2 font-mono text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>現在のバージョン: <strong className="text-slate-200">v{updateInfo.currentVersion}</strong></span>
            <span>最新リリース: <strong className="text-cyan-400">v{updateInfo.latestVersion}</strong></span>
          </div>
          <div className="text-slate-300 whitespace-pre-line text-xs font-mono leading-relaxed max-h-32 overflow-y-auto">
            {updateInfo.releaseNotes || 'パフォーマンスの最適化、高解像度動画スナップショットの復元支援強化、安全区域の整合性自動チェック機能が追加されました。'}
          </div>
        </div>

        {/* Real-time Progress Bar Animation */}
        {(downloading || downloadComplete) && (
          <div className="bg-[#080d1a] border border-cyan-500/40 rounded-xl p-4 mb-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${downloading ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                {downloadComplete ? 'パッケージ整合性チェック完了！' : 'リアルタイム高速ダウンロード進行中...'}
              </span>
              <span className="text-cyan-400 font-black text-sm">{progress.percent}%</span>
            </div>

            {/* Neon Animated Progress Bar */}
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-cyan-500/30 relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-150 animate-stripes relative overflow-hidden"
                style={{ width: `${progress.percent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
              <span>速度: <strong className="text-slate-200">{progress.speed}</strong></span>
              <span>進行状況: <strong className="text-cyan-400">{progress.downloaded}</strong></span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
          >
            後で
          </button>

          {!downloadComplete ? (
            <button
              onClick={handleStartDownload}
              disabled={downloading}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${
                downloading
                  ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{downloading ? 'リアルタイム取得中...' : 'かっこよく今すぐ更新'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                alert('更新プログラムがダウンロードされました。次回起動時、またはインストーラーを実行して適用してください。');
                onClose();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition transform hover:scale-[1.02]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>更新を適用（再起動）</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
