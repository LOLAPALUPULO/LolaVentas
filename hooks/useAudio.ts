import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to play audio sounds.
 * @param audioSrc The source of the audio (e.g., a data URI or URL).
 * @returns A function to trigger the audio playback.
 */
export const useAudio = (audioSrc: string): (() => void) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioSrc) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.preload = 'auto'; // Preload the audio
    }
    return () => {
      // Clean up audio object if component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start for quick successive plays
      audioRef.current.play().catch(error => console.error("Error playing audio:", error));
    }
  }, []);

  return play;
};
