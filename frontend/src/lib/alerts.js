const BEEPS = [0, 0.35, 0.7];

export function playNewJobSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    const context = new AudioContext();
    BEEPS.forEach((offset) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, context.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.25);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + offset);
      oscillator.stop(context.currentTime + offset + 0.3);
    });
    setTimeout(() => context.close(), 1500);
    return true;
  } catch {
    return false;
  }
}

export function vibrate(pattern = [200, 100, 200, 100, 400]) {
  try {
    return Boolean(navigator.vibrate?.(pattern));
  } catch {
    return false;
  }
}
