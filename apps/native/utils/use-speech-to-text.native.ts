import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from "@react-native-voice/voice";
import { useCallback, useEffect, useState } from "react";

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isSupported = true;

  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsListening(true);
      setError(null);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setTranscript((prev) => prev + e.value![0] + " ");
      }
    };

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setTranscript(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setError(e.error?.message ?? "Speech recognition error");
      setIsListening(false);
    };

    return () => {
      Voice.destroy().catch(() => {});
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      await Voice.start("en-US");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start listening");
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop listening");
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}
