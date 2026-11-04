import { useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenVoiceContext } from '@/app/screen-voice-context';
import { canSpeak, SPEECH_LOCALES, speak, speechRecognition, stopSpeaking } from '@/lib/speech';

export function useReadAloud() {
  const { i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    stopSpeaking();
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const read = useCallback(
    (text, audioSrc) => {
      stop();
      if (
        canSpeak(i18n.language) &&
        speak(text, i18n.language, { onEnd: () => setSpeaking(false) })
      ) {
        setSpeaking(true);
        return true;
      }
      if (!audioSrc) return false;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.play().catch(() => setSpeaking(false));
      setSpeaking(true);
      return true;
    },
    [i18n.language, stop],
  );

  useEffect(() => stop, [stop]);

  return { supported: canSpeak(i18n.language), speaking, read, stop };
}

export function useVoiceTyping(onText) {
  const { i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const Recognition = speechRecognition();

  const start = () => {
    if (!Recognition || listening) return;
    const recognition = new Recognition();
    recognition.lang = SPEECH_LOCALES[i18n.language] ?? i18n.language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      if (text) onText(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stop = () => recognitionRef.current?.stop();

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported: Boolean(Recognition), listening, start, stop };
}

export function useScreenVoice(text) {
  const { setText } = useContext(ScreenVoiceContext);
  useEffect(() => {
    setText(text ?? '');
    return () => setText('');
  }, [text, setText]);
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
