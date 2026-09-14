import { ExpiryTier, LoteEstoque } from '../types';

export function getDaysUntilExpiration(dataValidadeIso: string): number {
  const expiry = new Date(dataValidadeIso + 'T23:59:59');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryTier(dataValidadeIso: string): ExpiryTier {
  const days = getDaysUntilExpiration(dataValidadeIso);
  if (days < 0) return 'EXPIRED';
  if (days <= 30) return 'CRITICAL';
  if (days <= 90) return 'WARNING';
  return 'SAFE';
}

export function getExpiryBadgeInfo(tier: ExpiryTier) {
  switch (tier) {
    case 'EXPIRED':
      return {
        label: 'VENCIDO',
        colorClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
        dotColor: 'bg-rose-600',
        cardBorder: 'border-rose-500/40 dark:border-rose-900/60'
      };
    case 'CRITICAL':
      return {
        label: 'CRÍTICO (< 30 dias)',
        colorClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
        dotColor: 'bg-red-500 animate-pulse',
        cardBorder: 'border-red-500/40 dark:border-red-900/60'
      };
    case 'WARNING':
      return {
        label: 'ATENÇÃO (30 - 90 dias)',
        colorClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
        cardBorder: 'border-amber-400/30 dark:border-amber-800/40'
      };
    case 'SAFE':
      return {
        label: 'SEGURO (> 90 dias)',
        colorClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
        cardBorder: 'border-slate-200 dark:border-slate-800'
      };
  }
}

export function formatDatePtBr(isoDateStr: string): string {
  if (!isoDateStr) return 'N/I';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
}

export function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
}

export function playErrorSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Ignore
  }
}

export function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}
