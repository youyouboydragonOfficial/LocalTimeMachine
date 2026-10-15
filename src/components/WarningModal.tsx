import React from 'react';
import { AlertTriangle, ShieldCheck, Database, HardDrive, CheckCircle2, FileCheck } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  vaultDirectory: string;
}

export const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onConfirm, vaultDirectory }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="max-w-2xl w-full bg-[#0d1527] border-2 border-amber-500/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden neon-glow-amber">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse"></div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              インストール・利用確認
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1">
              ストレージ容量が「約2倍」使用されます
            </h2>
          </div>
        </div>

        {/* Body content */}
        <div className="space-y-4 text-sm text-slate-300">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            本アプリ「<span className="text-cyan-400 font-bold">Local Time Machine</span>」は、ユーザーの大切なファイル、写真、動画を万が一の事態から絶対に守るため、独自の二重保護アーキテクチャを採用しています。
          </p>

          <div className="bg-[#131d35] border border-slate-700/60 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              なぜ容量が2倍必要なのか？【明確な理由】
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-start gap-3 bg-[#0a0f1d] p-3 rounded-lg border border-slate-800">
                <FileCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">1. ショートカットのみの登録は禁止（完全物理コピー）</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    単なるショートカット保存ではなく、ファイル実体のバイナリデータをアプリ内部の「安全区域（Safe Vault）」へ複製保存します。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#0a0f1d] p-3 rounded-lg border border-slate-800">
                <HardDrive className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">2. 元ファイルが完全に削除されても即座に復元可能</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Windowsのエクスプローラー上でファイルを誤ってゴミ箱から完全削除してしまっても、アプリ内の隔離保管庫に本物が保存されているため、いつでも元通りに復活できます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#0a0f1d] p-3 rounded-lg border border-slate-800">
                <Database className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">3. 間違って上書き保存しても過去バージョンへ復元</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    編集ミスで上書きしてしまった場合でも、時系列（タイムライン）で過去のバージョン履歴を永久保存しているため、以前の状態へ安全に戻せます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-black/40 p-2.5 rounded border border-slate-800 flex items-center justify-between">
            <span>安全区域（隔離Vaultパス）:</span>
            <span className="text-cyan-400 truncate max-w-xs">{vaultDirectory}</span>
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>2倍の容量使用と理由を理解し、保護を開始する</span>
          </button>
        </div>
      </div>
    </div>
  );
};
