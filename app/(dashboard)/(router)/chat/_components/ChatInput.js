import { useState, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, Square, Play, Pause } from 'lucide-react';

export default function ChatInput({ input, setInput, sendMessage, inputRef }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage();
    } else if (audioBlob) {
      sendAudioMessage();
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || isUploading) return;

    setIsUploading(true);
    try {
      // Upload audio to Firebase Storage first
      const audioUrl = await uploadAudioToStorage(audioBlob);
      // Send the audio URL as message
      sendMessage(audioUrl, 'audio');
      resetAudio();
    } catch (error) {
      console.error('Failed to upload audio:', error);
      alert('Failed to send audio message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAudioToStorage = async (blob) => {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { app } = await import('../../../../../firebaseConfig');

    const storage = getStorage(app);
    const audioRef = ref(storage, `chat-audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.wav`);

    const snapshot = await uploadBytes(audioRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };

  const resetAudio = () => {
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSend} className="p-4 border-t bg-white flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* Audio Preview */}
        {audioBlob && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={playAudio}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    {isUploading ? 'Uploading audio...' : 'Audio Message'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {audioBlob.size ? `${(audioBlob.size / 1024).toFixed(1)} KB` : 'Recorded audio'}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={resetAudio}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete audio"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
            </div>
            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            >
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            </audio>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-medium">Recording... {formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 border">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent focus:outline-none px-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSend(e);
              }
            }}
            disabled={isRecording}
          />

          {/* Audio Recording Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            disabled={input.trim().length > 0}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            disabled={!input.trim() && !audioBlob || isUploading}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          {input.trim() ? 'Press Enter to send text' : 'Click microphone to record audio message'}
        </p>
      </div>
    </form>
  );
}