import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { videoSource } from '@/lib/video';
import { renderPage } from '@/test/utils';
import OfflineBanner from './OfflineBanner';
import ReadAloudButton from './ReadAloudButton';
import VoiceInputButton from './VoiceInputButton';

afterEach(() => vi.unstubAllGlobals());

describe('ReadAloudButton', () => {
  it('hides itself when the browser cannot speak and no clip is given', () => {
    renderPage(<ReadAloudButton text="নতুন কাজ" />);

    expect(screen.queryByRole('button', { name: 'Read this screen aloud' })).toBeNull();
  });

  it('shows a speaker button when an audio clip is available', () => {
    renderPage(<ReadAloudButton text="নতুন কাজ" audioSrc="/audio/new-job.mp3" />);

    expect(screen.getByRole('button', { name: 'Read this screen aloud' })).toBeInTheDocument();
  });
});

describe('VoiceInputButton', () => {
  it('appears only when speech recognition exists', () => {
    const { unmount } = renderPage(<VoiceInputButton onText={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Speak' })).toBeNull();
    unmount();

    vi.stubGlobal('webkitSpeechRecognition', function Recognition() {});
    renderPage(<VoiceInputButton onText={() => {}} />);
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();
  });
});

describe('OfflineBanner', () => {
  it('tells the user when the internet is gone', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderPage(<OfflineBanner />);

    expect(screen.getByRole('status')).toHaveTextContent('No internet');
  });
});

describe('videoSource', () => {
  it('turns YouTube links into privacy-friendly embeds', () => {
    expect(videoSource('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
    expect(videoSource('/media/tutorial.mp4').kind).toBe('file');
    expect(videoSource('')).toBeNull();
  });
});
