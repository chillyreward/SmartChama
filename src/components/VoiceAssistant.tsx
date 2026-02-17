"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceAssistantProps {
  userId?: string;
  chamaId?: string;
}

export default function VoiceAssistant({ userId, chamaId }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "sw-KE"; // Swahili (Kenya)

        recognitionInstance.onresult = async (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          await processCommand(speechResult);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setIsProcessing(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const processCommand = async (text: string) => {
    setIsProcessing(true);

    try {
      const res = await fetch("/api/voice-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioText: text,
          userId,
          chamaId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.response);
        
        // Speak the response
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(data.response);
          utterance.lang = "sw-KE";
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error("Error processing command:", error);
      setResponse("Sorry, I couldn't process that command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setResponse("");
      recognition.start();
      setIsListening(true);
    }
  };

  if (!recognition) {
    return null; // Don't show if not supported
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Voice Assistant Button */}
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`
          relative w-16 h-16 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300
          ${
            isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
        title="Voice Assistant"
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}

        {/* Listening indicator */}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </button>

      {/* Transcript/Response Display */}
      {(transcript || response) && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-xl p-4 border border-gray-200">
          {transcript && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">You said:</p>
              <p className="text-sm text-gray-800">{transcript}</p>
            </div>
          )}

          {response && (
            <div>
              <p className="text-xs text-gray-500 mb-1">AI Response:</p>
              <p className="text-sm text-purple-600 font-medium">{response}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!isListening && !transcript && (
        <div className="absolute bottom-20 right-0 w-64 bg-white rounded-lg shadow-xl p-3 border border-gray-200 text-xs text-gray-600">
          <p className="font-semibold mb-1">🎤 Voice AI Assistant</p>
          <p>Click to speak in Swahili or English</p>
          <p className="mt-1 text-gray-500">
            Try: "Je, nina pesa ngapi?" or "Check my balance"
          </p>
        </div>
      )}
    </div>
  );
}
