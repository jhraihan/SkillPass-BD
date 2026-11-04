export const SPEECH_LOCALES = { bn: 'bn-BD', en: 'en-US' };

function synthesis() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

function voiceFor(lang) {
  const voices = synthesis()?.getVoices() ?? [];
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang));
}

export function canSpeak(lang) {
  const engine = synthesis();
  if (!engine) return false;
  if (!lang) return true;
  const voices = engine.getVoices();
  return voices.length === 0 || Boolean(voiceFor(lang));
}

export function speak(text, lang = 'bn', { onEnd } = {}) {
  const engine = synthesis();
  if (!engine || !text) return false;
  try {
    engine.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[lang] ?? lang;
    utterance.rate = 0.9;
    const voice = voiceFor(lang);
    if (voice) utterance.voice = voice;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    engine.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  synthesis()?.cancel();
}

export function speechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
