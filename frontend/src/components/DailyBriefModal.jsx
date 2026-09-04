import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Volume2,
  VolumeX,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  Target
} from 'lucide-react';

export default function DailyBriefModal({ isOpen, onClose }) {
  const [brief, setBrief] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrief();
    } else {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    }
  }, [isOpen]);

  const fetchBrief = async () => {
    try {
      const res = await fetch('/api/daily-brief');
      if (res.ok) setBrief(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSpeech = () => {
    if (!brief || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(brief.audio_script);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!isOpen || !brief) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0C1220] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{brief.greeting}</h3>
              <p className="text-xs text-slate-400">Daily Executive Business Pulse for {brief.business_name}</p>
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

        {/* 3 Morning Pulse KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          {brief.kpis?.map((k, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">{k.label}</div>
              <div className="text-sm font-black text-white my-0.5">{k.value}</div>
              <div className={`text-[10px] font-bold ${k.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {k.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Alerts & Insights */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 font-medium leading-relaxed">
            {brief.important_alert}
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-medium leading-relaxed">
            {brief.opportunity}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 font-medium leading-relaxed flex items-start gap-2">
            <Target className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-400 mb-0.5">Today's Priority:</strong>
              {brief.priority}
            </div>
          </div>
        </div>

        {/* Audio Player Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={toggleSpeech}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Audio Briefing' : 'Listen to Voice CFO Briefing'}</span>
          </button>

          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              setIsPlaying(false);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

