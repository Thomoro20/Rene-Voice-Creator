
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PHRASES } from './constants';
import type { Phrase, Recording, StoredRecording } from './types';
import { RecorderState } from './types';
import { useRecorder } from './hooks/useRecorder';
import { transcribeAudio } from './services/geminiService';
import { BrainIcon, MicIcon, PlayIcon, StopIcon, TrashIcon, SpeakerIcon, TrainingIcon } from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';
import { blobToBase64, base64ToBlob } from './utils/converters';

type View = 'training' | 'recognition';

const App: React.FC = () => {
    const [apiKey, setApiKey] = useLocalStorage<string | null>('gemini-api-key', null);

    if (!apiKey) {
        return <ApiKeyModal onApiKeySubmit={setApiKey} />;
    }

    return <MainApp apiKey={apiKey} onClearKey={() => setApiKey(null)} />;
};

interface ApiKeyModalProps {
    onApiKeySubmit: (key: string) => void;
}
const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit }) => {
    const [inputKey, setInputKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            onApiKeySubmit(inputKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-background bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-surface rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                <BrainIcon className="h-12 w-12 text-brand-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Willkommen beim René-Voice-Creator</h2>
                <p className="text-brand-text-dim mb-6">Bitte geben Sie Ihren Google Gemini API-Schlüssel ein, um zu beginnen. Der Schlüssel wird sicher auf diesem Gerät gespeichert.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="API-Schlüssel hier einfügen"
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-brand-primary focus:border-brand-primary w-full"
                        aria-label="API-Schlüssel"
                    />
                    <button
                        type="submit"
                        className="bg-brand-primary text-brand-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!inputKey.trim()}
                    >
                        Speichern und Starten
                    </button>
                </form>
            </div>
        </div>
    );
};

interface MainAppProps {
    apiKey: string;
    onClearKey: () => void;
}
const MainApp: React.FC<MainAppProps> = ({ apiKey, onClearKey }) => {
  const [activeView, setActiveView] = useState<View>('recognition');
  const [phrases, setPhrases] = useLocalStorage<Phrase[]>('phrases', PHRASES);
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const [recordings, setRecordings] = useLocalStorage<StoredRecording[]>('recordings', []);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [germanVoices, setGermanVoices] = useState<SpeechSynthesisVoice[]>([]);

  const { recorderState, audioBlob, startRecording, stopRecording, resetRecorder } = useRecorder();

  const displayRecordings = useMemo(() => {
    return recordings.map(rec => {
        try {
            const blob = base64ToBlob(rec.audioBase64, rec.mimeType);
            return {
                id: rec.id,
                phraseId: rec.phraseId,
                audioBlob: blob,
                audioUrl: URL.createObjectURL(blob),
            };
        } catch(e) {
            console.error("Failed to convert base64 to blob for recording:", rec.id, e);
            return null;
        }
    }).filter((r): r is Recording => r !== null);
  }, [recordings]);
  
  useEffect(() => {
      return () => {
          displayRecordings.forEach(rec => URL.revokeObjectURL(rec.audioUrl));
      }
  }, [displayRecordings]);

  useEffect(() => {
    if (phrases.length > 0 && !selectedPhrase) {
        setSelectedPhrase(phrases[0]);
    } else if (phrases.length > 0 && selectedPhrase) {
        if (!phrases.some(p => p.id === selectedPhrase.id)) {
            setSelectedPhrase(phrases[0]);
        }
    } else if (phrases.length === 0) {
        setSelectedPhrase(null);
    }
  }, [phrases, selectedPhrase]);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('de'));
        setGermanVoices(voices);
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    
    if (germanVoices.length > 0) {
        let voiceToUse: SpeechSynthesisVoice | undefined;

        if (selectedGender === 'male') {
            voiceToUse = germanVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('männlich'));
            if (!voiceToUse) {
                voiceToUse = germanVoices.find(v => !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('weiblich'));
            }
        } else {
            voiceToUse = germanVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('weiblich'));
        }
        
        utterance.voice = voiceToUse || germanVoices.find(v => v.lang === 'de-DE') || germanVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  }, [germanVoices, selectedGender]);

  const handleAddPhrase = (text: string) => {
    if (!text.trim()) return;
    const newPhrase: Phrase = {
      id: Date.now(),
      text: text.trim(),
      lang: 'de',
    };
    setPhrases(prev => [newPhrase, ...prev]);
    setSelectedPhrase(newPhrase);
  };

  const handleSaveRecording = useCallback(async () => {
    if (audioBlob && selectedPhrase) {
      const audioBase64 = await blobToBase64(audioBlob);
      const newRecording: StoredRecording = {
        id: crypto.randomUUID(),
        phraseId: selectedPhrase.id,
        audioBase64,
        mimeType: audioBlob.type,
      };
      setRecordings(prev => [...prev, newRecording]);
      resetRecorder();
    }
  }, [audioBlob, selectedPhrase, resetRecorder, setRecordings]);

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };
  
  const handleRecognize = useCallback(async () => {
      if (audioBlob) {
          setIsLoading(true);
          setError('');
          setTranscription('');
          try {
              const trainingExamples: { audioBlob: Blob; text: string }[] = [];
              const availableRecordings = [...recordings];
              
              const numExamples = Math.min(5, availableRecordings.length);
              if (numExamples > 0) {
                  const shuffled = availableRecordings.sort(() => 0.5 - Math.random());
                  const selectedExamples = shuffled.slice(0, numExamples);

                  for (const storedRec of selectedExamples) {
                      const phrase = phrases.find(p => p.id === storedRec.phraseId);
                      if (phrase) {
                          try {
                            const exampleBlob = base64ToBlob(storedRec.audioBase64, storedRec.mimeType);
                            trainingExamples.push({ audioBlob: exampleBlob, text: phrase.text });
                          } catch(e) {
                            console.error("Failed to prepare training example:", storedRec.id, e)
                          }
                      }
                  }
              }

              const result = await transcribeAudio(apiKey, audioBlob, trainingExamples);
              setTranscription(result);
          } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
              setError(errorMessage);
              if (errorMessage.includes("API-Schlüssel ist ungültig")) {
                  onClearKey();
              }
          } finally {
              setIsLoading(false);
              resetRecorder();
          }
      }
  }, [apiKey, audioBlob, resetRecorder, recordings, phrases, onClearKey]);

  useEffect(() => {
    if (activeView === 'recognition' && recorderState === RecorderState.STOPPED && audioBlob) {
      handleRecognize();
    }
  }, [recorderState, audioBlob, activeView, handleRecognize]);

  useEffect(() => {
    if (activeView === 'training' && recorderState === RecorderState.STOPPED && audioBlob) {
        handleSaveRecording();
    }
  }, [recorderState, audioBlob, activeView, handleSaveRecording]);


  return (
    <div className="min-h-screen bg-brand-background text-brand-text p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <Header />
        <ViewTabs activeView={activeView} setActiveView={setActiveView} />

        <main className="mt-6">
          {activeView === 'training' && (
            <TrainingView 
              phrases={phrases}
              onAddPhrase={handleAddPhrase}
              selectedPhrase={selectedPhrase}
              setSelectedPhrase={setSelectedPhrase}
              recordings={displayRecordings}
              onDeleteRecording={handleDeleteRecording}
              recorderState={recorderState}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
            />
          )}
          {activeView === 'recognition' && (
            <RecognitionView 
              recorderState={recorderState}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              isLoading={isLoading}
              transcription={transcription}
              error={error}
              onSpeak={speak}
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
            />
          )}
        </main>
        <footer className="text-center mt-8">
            <button onClick={onClearKey} className="text-xs text-brand-text-dim hover:text-white transition-colors">
                API-Schlüssel zurücksetzen
            </button>
        </footer>
      </div>
    </div>
  );
};

const Header: React.FC = () => (
  <header className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-brand-surface">
    <div className="flex items-center space-x-3">
        <BrainIcon className="h-10 w-10 text-brand-primary" />
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">René-Voice-Creator</h1>
    </div>
    <p className="text-brand-text-dim mt-2 sm:mt-0 text-center sm:text-right">Ihre Stimme, klar und verständlich.</p>
  </header>
);

interface ViewTabsProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

const ViewTabs: React.FC<ViewTabsProps> = ({ activeView, setActiveView }) => {
    const commonClasses = "flex-1 sm:flex-none sm:px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-3";
    const activeClasses = "bg-brand-primary text-brand-background shadow-lg scale-105";
    const inactiveClasses = "bg-brand-surface text-brand-text-dim hover:bg-gray-600 hover:text-white";

    return (
        <div className="mt-6 flex flex-col sm:flex-row gap-4 bg-brand-surface/50 p-2 rounded-xl">
            <button onClick={() => setActiveView('recognition')} className={`${commonClasses} ${activeView === 'recognition' ? activeClasses : inactiveClasses}`}>
                <BrainIcon className="h-6 w-6" />
                Erkennung
            </button>
            <button onClick={() => setActiveView('training')} className={`${commonClasses} ${activeView === 'training' ? activeClasses : inactiveClasses}`}>
                <TrainingIcon className="h-6 w-6" />
                Training
            </button>
        </div>
    );
}

interface TrainingViewProps {
    phrases: Phrase[];
    onAddPhrase: (text: string) => void;
    selectedPhrase: Phrase | null;
    setSelectedPhrase: (phrase: Phrase) => void;
    recordings: Recording[];
    onDeleteRecording: (id: string) => void;
    recorderState: RecorderState;
    onStartRecord: () => void;
    onStopRecord: () => void;
}
const TrainingView: React.FC<TrainingViewProps> = ({ phrases, onAddPhrase, selectedPhrase, setSelectedPhrase, recordings, onDeleteRecording, recorderState, onStartRecord, onStopRecord }) => {
    const phraseRecordings = useMemo(() => recordings.filter(r => r.phraseId === selectedPhrase?.id), [recordings, selectedPhrase]);

    return(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-brand-surface rounded-xl p-4 h-fit">
                <h2 className="text-xl font-bold mb-4 text-brand-primary">Sätze zum Trainieren</h2>
                <AddCustomPhrase onAdd={onAddPhrase} />
                <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {phrases.map(phrase => (
                        <li key={phrase.id}>
                            <button
                                onClick={() => setSelectedPhrase(phrase)}
                                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${selectedPhrase?.id === phrase.id ? 'bg-brand-primary text-brand-background font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {phrase.text}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="lg:col-span-2 bg-brand-surface rounded-xl p-6">
                {selectedPhrase ? (
                    <div>
                        <p className="text-brand-text-dim mb-1">Ausgewählter Satz:</p>
                        <h2 className="text-3xl font-bold text-white mb-6">{selectedPhrase.text}</h2>
                        
                        <div className="flex items-center justify-center flex-col gap-4 bg-gray-900/50 p-6 rounded-xl">
                           <p className="text-brand-text-dim">Nehmen Sie den Satz auf, um das System zu trainieren.</p>
                            <RecordButton state={recorderState} onStart={onStartRecord} onStop={onStopRecord} />
                             {recorderState === RecorderState.RECORDING && <p className="text-red-400 animate-pulse">Aufnahme läuft...</p>}
                        </div>

                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-4 text-brand-primary">Aufnahmen ({phraseRecordings.length})</h3>
                            {phraseRecordings.length > 0 ? (
                                <ul className="space-y-3">
                                    {phraseRecordings.map((rec, index) => (
                                        <RecordingItem key={rec.id} recording={rec} index={index + 1} onDelete={onDeleteRecording} />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-brand-text-dim p-4 bg-gray-900/50 rounded-lg text-center">Noch keine Aufnahmen für diesen Satz vorhanden.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xl text-brand-text-dim">Bitte wählen Sie links einen Satz aus oder fügen Sie einen neuen hinzu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface AddCustomPhraseProps {
  onAdd: (text: string) => void;
}

const AddCustomPhrase: React.FC<AddCustomPhraseProps> = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-3 bg-gray-900/50 rounded-lg">
      <label htmlFor="custom-phrase" className="block text-sm font-medium text-brand-text-dim mb-2">
        Eigenen Satz hinzufügen:
      </label>
      <div className="flex gap-2">
        <input
          id="custom-phrase"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="z.B. 'Ich möchte schlafen'"
          className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-brand-primary focus:border-brand-primary w-full"
          aria-label="Eigener Satz"
        />
        <button
          type="submit"
          className="bg-brand-primary text-brand-background font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim()}
          aria-label="Eigenen Satz hinzufügen"
        >
          Hinzufügen
        </button>
      </div>
    </form>
  );
};


interface RecordingItemProps {
    recording: Recording;
    index: number;
    onDelete: (id: string) => void;
}
const RecordingItem: React.FC<RecordingItemProps> = ({ recording, index, onDelete }) => {
    const playAudio = () => {
        const audio = new Audio(recording.audioUrl);
        audio.play();
    };
    return (
        <li className="flex items-center justify-between bg-gray-700 p-3 rounded-lg animate-fade-in">
            <div className="flex items-center gap-4">
                <span className="text-brand-text-dim font-mono">{index}.</span>
                <button onClick={playAudio} className="p-2 rounded-full bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-brand-background transition-colors" aria-label={`Aufnahme ${index} abspielen`}>
                    <PlayIcon className="h-5 w-5" />
                </button>
                <span className="text-brand-text">Aufnahme {index}</span>
            </div>
            <button onClick={() => onDelete(recording.id)} className="p-2 rounded-full text-brand-secondary hover:bg-red-500 hover:text-white transition-colors" aria-label={`Aufnahme ${index} löschen`}>
                <TrashIcon className="h-5 w-5" />
            </button>
        </li>
    );
};

interface RecordButtonProps {
    state: RecorderState;
    onStart: () => void;
    onStop: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ state, onStart, onStop }) => {
    const isRecording = state === RecorderState.RECORDING;

    return (
        <button
            onClick={isRecording ? onStop : onStart}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                isRecording
                    ? 'bg-red-500 text-white animate-pulse ring-red-400'
                    : 'bg-brand-primary text-brand-background hover:scale-105 ring-brand-primary'
            }`}
             aria-label={isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
        >
            {isRecording ? <StopIcon className="h-10 w-10" /> : <MicIcon className="h-10 w-10" />}
        </button>
    );
}

interface RecognitionViewProps {
    recorderState: RecorderState;
    onStartRecord: () => void;
    onStopRecord: () => void;
    isLoading: boolean;
    transcription: string;
    error: string;
    onSpeak: (text: string) => void;
    selectedGender: 'male' | 'female';
    onGenderChange: (gender: 'male' | 'female') => void;
}

const RecognitionView: React.FC<RecognitionViewProps> = ({ recorderState, onStartRecord, onStopRecord, isLoading, transcription, error, onSpeak, selectedGender, onGenderChange }) => {
    const showResult = transcription && !isLoading && !error;
    
    return(
        <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="bg-brand-surface rounded-2xl shadow-2xl p-8 w-full max-w-2xl min-h-[400px] flex flex-col justify-center items-center transition-all duration-300">
                {!isLoading && !transcription && !error && (
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-2">Bereit für Ihre Stimme</h2>
                        <p className="text-brand-text-dim mb-8">Klicken Sie auf den Knopf, um mit der Spracherkennung zu beginnen.</p>
                        <RecordButton state={recorderState} onStart={onStartRecord} onStop={onStopRecord} />
                    </div>
                )}

                {recorderState === RecorderState.RECORDING && (
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-bold text-red-400 mb-8 animate-pulse">Aufnahme läuft...</h2>
                        <RecordButton state={recorderState} onStart={onStartRecord} onStop={onStopRecord} />
                    </div>
                )}
                
                {isLoading && <LoadingSpinner />}

                {error && <ErrorDisplay message={error} />}

                {showResult && (
                    <div className="animate-fade-in w-full">
                        <p className="text-brand-text-dim mb-2">Erkannt:</p>
                        <p className="text-4xl font-bold text-brand-primary mb-8 break-words">"{transcription}"</p>
                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => onSpeak(transcription)} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                                <SpeakerIcon className="h-6 w-6"/>
                                Vorlesen
                            </button>
                            <button onClick={onStartRecord} className="bg-brand-primary text-brand-background font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                                <MicIcon className="h-6 w-6"/>
                                Erneut sprechen
                            </button>
                        </div>

                        <div className="mt-8 w-full">
                          <p id="voice-gender-label" className="text-brand-text-dim mb-3 text-sm">Stimme für die Ausgabe:</p>
                          <div className="flex justify-center gap-4" role="radiogroup" aria-labelledby="voice-gender-label">
                            <button
                              role="radio"
                              aria-checked={selectedGender === 'male'}
                              onClick={() => onGenderChange('male')}
                              className={`py-2 px-6 rounded-lg font-semibold transition-all duration-200 border-2 ${
                                selectedGender === 'male' 
                                  ? 'bg-brand-primary text-brand-background border-brand-primary' 
                                  : 'bg-transparent border-brand-secondary text-brand-text-dim hover:bg-brand-secondary hover:text-white'
                              }`}
                            >
                              Männlich
                            </button>
                            <button
                              role="radio"
                              aria-checked={selectedGender === 'female'}
                              onClick={() => onGenderChange('female')}
                              className={`py-2 px-6 rounded-lg font-semibold transition-all duration-200 border-2 ${
                                selectedGender === 'female'
                                  ? 'bg-brand-primary text-brand-background border-brand-primary'
                                  : 'bg-transparent border-brand-secondary text-brand-text-dim hover:bg-brand-secondary hover:text-white'
                              }`}
                            >
                              Weiblich
                            </button>
                          </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-brand-text-dim animate-fade-in">
        <BrainIcon className="h-16 w-16 text-brand-primary animate-spin" style={{ animationDuration: '2s' }} />
        <p className="text-xl font-semibold">Analysiere Audio...</p>
    </div>
);

interface ErrorDisplayProps {
  message: string;
}
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => (
    <div className="animate-fade-in text-center bg-red-900/50 p-6 rounded-lg w-full">
        <h3 className="text-xl font-bold text-red-400 mb-2">Fehler bei der Erkennung</h3>
        <p className="text-red-300">{message}</p>
    </div>
);


export default App;
