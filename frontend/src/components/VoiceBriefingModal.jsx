import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Bot,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function VoiceBriefingModal({ isOpen, onClose, dashboardData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen && isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !dashboardData) return null;

  const summary = dashboardData.summary || {};
  const health = dashboardData.health_score || {};
  const weakness = health.biggest_weakness?.description || "Overdue customer receivables";

  const briefingScript = `Good morning executive team. Here is your daily AI CFO briefing for ${dashboardData.profile?.business_name || "your enterprise"}.

Your current Business Health Score stands at ${health.overall_score} out of 100, indicating moderate risk.

Your six-month revenue reached ${Math.round((summary.total_revenue || 0) / 100000)} Lakh rupees, delivering a net profit margin of ${summary.net_profit_margin_pct || 5.2} percent.

Our profit leak radar has detected 6 active leaks bleeding approximately 1 Lakh 36 Thousand rupees per month. The primary drag on your cashflow is: ${weakness}.

My top recommendation for today: Enforce strict stop-supply on accounts past 45 days overdue, and issue price renegotiation notices to your microcontroller suppliers to protect gross margin.`;

  const toggleSpeech = () => {
    if (!speechSynthesisAvailable) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any pending
      const utterance = new SpeechSynthesisUtterance(briefingScript);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Voice CFO Audio Briefing</h3>
              <p className="text-xs text-slate-400">Audio Intelligence Synthesis</p>
            </div>
          </div>

          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              setIsPlaying(false);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Wave Visualizer Simulation */}
        <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-1.5 h-12">
            {[40, 70, 30, 90, 60, 100, 45, 80, 55, 90, 35, 75].map((height, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
                  }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (height * Math.random() + 20))}%` : '20%',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          <button
            onClick={toggleSpeech}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Audio Briefing</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Voice CFO Briefing</span>
              </>
            )}
          </button>
        </div>

        {/* Script Preview */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-medium">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
            Briefing Transcript:
          </span>
          <p className="line-clamp-4 text-slate-300">
            {briefingScript}
          </p>
        </div>

      </div>
    </div>
  );
}

