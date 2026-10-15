import React from 'react';
import { ShieldCheck, Plus, RefreshCw, HardDrive, Search, Filter, Clock, Image, Video, FileText, Code2, Sparkles } from 'lucide-react';
import { VaultStats, FileCategory } from '../types';

interface TimeMachineHeaderProps {
  stats: VaultStats | null;
  onAddFiles: () => void;
  onCheckUpdate: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const TimeMachineHeader: React.FC<TimeMachineHeaderProps> = ({
  stats,
  onAddFiles,
  onCheckUpdate,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const categories = [
    { id: 'all', label: 'すべて', icon: Clock },
    { id: 'image', label: '写真', icon: Image },
    { id: 'video', label: '動画', icon: Video },
    { id: 'document', label: '文書', icon: FileText },
    { id: 'code', label: 'コード', icon: Code2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Clock className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '30s' }} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0a0f1d]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-orbitron tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                LOCAL TIME MACHINE
              </h1>
              <span className="text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                VAULT v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                安全区域二重保護稼働中
              </span>
              <span>•</span>
              <span className="text-amber-400 font-mono text-[11px]">容量2x二重保管率: 200%</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stats summary chip */}
          {stats && (
            <div className="hidden sm:flex items-center gap-3 bg-[#0f172a] border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>安全区域: <strong className="text-cyan-400">{formatBytes(stats.totalVaultSizeBytes)}</strong></span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="text-slate-300">
                世代: <strong className="text-emerald-400">{stats.totalSnapshots} 件</strong>
              </div>
            </div>
          )}

          {/* Update Checker Button */}
          <button
            onClick={onCheckUpdate}
            title="起動時更新チェックを実行"
            className="p-2.5 bg-[#0f172a] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 rounded-xl text-xs flex items-center gap-1.5 transition font-mono"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">更新確認</span>
          </button>

          {/* Add file snapshot button */}
          <button
            onClick={onAddFiles}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>ファイル・写真・動画を安全保存</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ファイル名、拡張子、ハッシュで検索..."
            className="w-full bg-[#0d1424] border border-slate-700/70 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
          />
        </div>
      </div>
    </header>
  );
};
