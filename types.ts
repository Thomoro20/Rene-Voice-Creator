
export interface Phrase {
  id: number;
  text: string;
  lang: 'de' | 'ch'; // German or Swiss German
}

export interface Recording {
  id: string;
  phraseId: number;
  audioBlob: Blob;
  audioUrl: string;
}

// Add StoredRecording for localStorage persistence
export interface StoredRecording {
  id: string;
  phraseId: number;
  audioBase64: string;
  mimeType: string;
}

export enum RecorderState {
  IDLE = 'idle',
  REQUESTING_PERMISSION = 'requesting_permission',
  RECORDING = 'recording',
  STOPPED = 'stopped',
  ERROR = 'error',
}
