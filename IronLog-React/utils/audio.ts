
// Simple oscillator beep to avoid loading external assets
export const playTimerFinishSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

// Haptic Feedback Utility
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'light':
                navigator.vibrate(10); // Subtle click
                break;
            case 'medium':
                navigator.vibrate(40); // Standard tap
                break;
            case 'heavy':
                navigator.vibrate(70); // Strong feedback
                break;
            case 'success':
                navigator.vibrate([50, 50, 50]); // Da-da-da pattern
                break;
            case 'warning':
                navigator.vibrate([100, 50, 100]); // Long-short-long
                break;
        }
    }
};
