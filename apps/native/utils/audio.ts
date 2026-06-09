function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  return new AudioContextClass();
}

export function playTone(frequency: number, duration: number, volume = 0.08) {
  const context = getAudioContext();
  if (!context) {
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + duration
  );
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration + 0.05);
}

export function playSoftChime() {
  playTone(523.25, 0.4, 0.06);
}

export function playToneSequence() {
  const context = getAudioContext();
  if (!context) {
    return;
  }
  const notes = [261.63, 329.63, 392, 523.25];
  let currentTime = context.currentTime + 0.05;
  for (const frequency of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.4);
    currentTime += 0.42;
  }
}
