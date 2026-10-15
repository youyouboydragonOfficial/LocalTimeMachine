import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, History, FastForward, RotateCcw } from 'lucide-react';

interface TimeSliderProps {
  minTimestamp: number;
  maxTimestamp: number;
  currentTimestamp: number;
  onTimeChange: (ts: number) => void;
  snapshotTimestamps: number[];
  onResetToLatest: () => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  minTimestamp,
  maxTimestamp,
  currentTimestamp,
  onTimeChange,
  snapshotTimestamps,
  onResetToLatest,
}) => {
  const isLatest = currentTimestamp >= maxTimestamp;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const jumpToPrevious = () => {
    const prevs = snapshotTimestamps.filter((t) => t < currentTimestamp);
    if (prevs.length > 0) {
      const closest = Math.max(...prevs);
      onTimeChange(closest);
    }
  };

  const jumpToNext = () => {
    const nexts = snapshotTimestamps.filter((t) => t > currentTimestamp);
    if (nexts.length > 0) {
      const closest = Math.min(...nexts);
      onTimeChange(closest);
    }
  };

  return (
    <div className="bg-[#0c1426] border-y border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Time Travel Display */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
            <History className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">タイムトラベル時点</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono text-cyan-300">
                {formatDate(currentTimestamp)}
              </span>
              {isLatest ? (
                <span className="text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  現在 (最新)
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                  過去のスナップショット
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Slider & Navigation */}
        <div className="flex-1 max-w-xl w-full flex items-center gap-3">
          <button
            onClick={jumpToPrevious}
            title="1つ過去のスナップショットへ"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 relative flex items-center">
            {/* Markers on slider */}
            <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full">
              {maxTimestamp > minTimestamp &&
                snapshotTimestamps.map((ts, idx) => {
                  const pct = ((ts - minTimestamp) / (maxTimestamp - minTimestamp)) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-cyan-500/60 rounded-sm hover:scale-125 transition"
                      style={{ left: `${Math.min(100, Math.max(0, pct))}%` }}
                      title={formatDate(ts)}
                    />
                  );
                })}
            </div>

            <input
              type="range"
              min={minTimestamp}
              max={maxTimestamp}
              value={currentTimestamp}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              className="w-full relative z-10 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50"
            />
          </div>

          <button
            onClick={jumpToNext}
            title="1つ未来のスナップショットへ"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isLatest && (
            <button
              onClick={onResetToLatest}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>最新に戻す</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
