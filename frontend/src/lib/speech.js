const LOCALES = { bn: 'bn-BD', en: 'en-US' };

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text, lang = 'bn') {
  if (!canSpeak() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LOCALES[lang] ?? lang;
    utterance.rate = 0.9;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith(lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
