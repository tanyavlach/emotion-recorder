// Web Speech API Transcription Manager
class TranscriptionManager {
    constructor() {
        this.recognition = null;
        this.transcript = '';
        this.isListening = false;
        this.onTranscriptUpdate = null;
        this.onTranscriptComplete = null;
        
        this.initRecognition();
    }

    initRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported in this browser');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('Speech recognition started');
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update full transcript
            if (finalTranscript) {
                this.transcript += finalTranscript;
            }
            
            // Callback with current transcript
            if (this.onTranscriptUpdate) {
                this.onTranscriptUpdate(this.transcript + interimTranscript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'no-speech') {
                console.log('No speech detected');
            } else if (event.error === 'audio-capture') {
                console.error('No microphone found');
            } else if (event.error === 'not-allowed') {
                console.error('Microphone permission denied');
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Speech recognition ended');
            
            if (this.onTranscriptComplete) {
                this.onTranscriptComplete(this.transcript.trim());
            }
        };
    }

    start() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return false;
        }
        
        this.transcript = '';
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            return false;
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    getTranscript() {
        return this.transcript.trim();
    }

    reset() {
        this.transcript = '';
    }

    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}
