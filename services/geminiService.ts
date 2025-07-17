
import { GoogleGenAI, Content } from "@google/genai";
import { blobToBase64 } from "../utils/converters";

interface TrainingExample {
    audioBlob: Blob;
    text: string;
}

export const transcribeAudio = async (
    apiKey: string,
    audioBlob: Blob, 
    trainingExamples: TrainingExample[]
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is not provided.");
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const systemInstruction = `Du bist ein Experte für Dysarthrie. Deine Aufgabe ist es, Audioaufnahmen von einem Sprecher mit einer Sprachbehinderung zu transkribieren. Der Sprecher kommuniziert auf Schweizerdeutsch oder Hochdeutsch.
Du erhältst einige Beispiele, bei denen eine Audioaufnahme und die dazugehörige korrekte Transkription als klares Hochdeutsch bereitgestellt werden.
Basierend auf diesen Beispielen, transkribiere die finale Audioaufnahme.
Das Ziel ist es, die Absicht des Sprechers zu erfassen und in einen verständlichen Satz auf Hochdeutsch umzuwandeln. Gib NUR den transkribierten Text zurück, ohne zusätzliche Erklärungen oder einleitende Sätze.`;
        
        const contents: Content[] = [];

        // Prepare all base64 conversions in parallel
        if (trainingExamples.length > 0) {
            const exampleBlobs = trainingExamples.map(ex => ex.audioBlob);
            const exampleBase64s = await Promise.all(exampleBlobs.map(blob => blobToBase64(blob)));

            trainingExamples.forEach((example, index) => {
                contents.push({
                    role: 'user',
                    parts: [
                        { text: "Hier ist ein Beispielaudio eines Sprechers mit Dysarthrie:" },
                        { inlineData: { mimeType: example.audioBlob.type || 'audio/webm', data: exampleBase64s[index] } }
                    ]
                });
                contents.push({
                    role: 'model',
                    parts: [{ text: example.text }]
                });
            });
        }

        // Add the final audio to be transcribed
        const newAudioBase64 = await blobToBase64(audioBlob);
        const finalPromptText = trainingExamples.length > 0
            ? "Transkribiere nun, basierend auf den obigen Beispielen, diese neue Audioaufnahme:"
            : "Transkribiere diese Audioaufnahme eines Sprechers mit einer Sprachbehinderung (Dysarthrie). Gib nur den transkribierten Text als klares Hochdeutsch zurück.";

        contents.push({
            role: 'user',
            parts: [
                { text: finalPromptText },
                {
                    inlineData: {
                        mimeType: audioBlob.type || 'audio/webm',
                        data: newAudioBase64,
                    },
                }
            ]
        });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents, // Pass the whole history
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error transcribing audio with Gemini:", error);
        if (error instanceof Error && error.message.includes("API key not valid")) {
             throw new Error("Der API-Schlüssel ist ungültig. Bitte überprüfen Sie ihn.");
        }
        throw new Error("Failed to get transcription from AI.");
    }
};
