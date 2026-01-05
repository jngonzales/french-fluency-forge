import { useState, useRef, useCallback } from "react";
import { convertToWav, canConvertToWav } from "@/lib/audio/wavConverter";

interface UseAudioRecorderOptions {
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number; // in seconds
  convertToWavOnStop?: boolean; // Auto-convert to WAV when recording stops
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  wavBlob: Blob | null; // WAV version for Azure
  error: string | null;
  isConverting: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  getWavBlob: () => Promise<Blob | null>; // Manual WAV conversion
}

export const useAudioRecorder = (
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn => {
  const { onRecordingComplete, maxDuration = 60, convertToWavOnStop = false } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];

      // Clean up previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Auto-convert to WAV if requested (for Azure)
        if (convertToWavOnStop && canConvertToWav()) {
          setIsConverting(true);
          try {
            const wav = await convertToWav(blob);
            setWavBlob(wav);
            console.log('[Audio Recorder] Auto-converted to WAV:', wav.size, 'bytes');
          } catch (err) {
            console.error('[Audio Recorder] WAV conversion failed:', err);
            // Continue anyway with original blob
          } finally {
            setIsConverting(false);
          }
        }
        
        onRecordingComplete?.(blob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access to continue.");
      } else {
        setError("Failed to start recording. Please check your microphone.");
      }
    }
  }, [audioUrl, maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    clearTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
  }, [clearTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearTimer();
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
  }, [maxDuration, stopRecording]);

  const resetRecording = useCallback(() => {
    stopRecording();

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setWavBlob(null);
    setRecordingTime(0);
    setError(null);
    setIsConverting(false);
    chunksRef.current = [];
  }, [audioUrl, stopRecording]);

  // Manual WAV conversion
  const getWavBlob = useCallback(async (): Promise<Blob | null> => {
    if (!audioBlob) {
      return null;
    }

    if (wavBlob) {
      return wavBlob; // Return cached version
    }

    if (!canConvertToWav()) {
      console.warn('[Audio Recorder] Browser does not support WAV conversion');
      return null;
    }

    setIsConverting(true);
    try {
      const wav = await convertToWav(audioBlob);
      setWavBlob(wav);
      console.log('[Audio Recorder] Converted to WAV:', wav.size, 'bytes');
      return wav;
    } catch (err) {
      console.error('[Audio Recorder] WAV conversion failed:', err);
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [audioBlob, wavBlob]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    wavBlob,
    error,
    isConverting,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getWavBlob,
  };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
