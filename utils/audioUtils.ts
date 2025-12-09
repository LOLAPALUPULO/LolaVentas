// Web Audio API context
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    // Fix: Use AudioContext directly as webkitAudioContext is deprecated
    audioContext = new AudioContext();
  }
  return audioContext;
};

export const playBeep = (frequency: number, duration: number = 100) => {
  const context = getAudioContext();
  if (!context) {
    console.warn("AudioContext not available.");
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.type = 'sine'; // Sine wave for a clean beep
  oscillator.frequency.setValueAtTime(frequency, context.currentTime); // Set frequency
  gainNode.gain.setValueAtTime(0.5, context.currentTime); // Start at 50% volume

  oscillator.start(context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration / 1000); // Fade out
  oscillator.stop(context.currentTime + duration / 1000); // Stop after duration
};