
import { useState, useRef, useCallback } from 'react';
import { RecorderState } from '../types';

export const useRecorder = () => {
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setRecorderState(RecorderState.REQUESTING_PERMISSION);
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type });
        setAudioBlob(blob);
        setRecorderState(RecorderState.STOPPED);
        chunksRef.current = [];
        // Clean up the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setRecorderState(RecorderState.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setRecorderState(RecorderState.ERROR);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecorder = useCallback(() => {
    setAudioBlob(null);
    setRecorderState(RecorderState.IDLE);
  }, []);

  return { recorderState, audioBlob, startRecording, stopRecording, resetRecorder };
};
