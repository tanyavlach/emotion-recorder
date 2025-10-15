// Main Application Controller
class EmotionRecorderApp {
    constructor() {
        // Initialize managers
        this.recorder = new VideoRecorder();
        this.transcription = new TranscriptionManager();
        this.emotionWheel = null;
        this.visualization = null;
        
        // State
        this.isRunning = false;
        this.isPaused = false;
        this.intervalTimer = null;
        this.intervalDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.nextCaptureTime = null;
        this.currentTranscript = '';
        this.currentEmotionData = null;
        this.currentVideoBlob = null;
        
        // DOM elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            countdown: document.getElementById('countdown'),
            status: document.getElementById('status'),
            recordingSection: document.getElementById('recordingSection'),
            emotionSection: document.getElementById('emotionSection'),
            videoPreview: document.getElementById('videoPreview'),
            recordingTimer: document.getElementById('recordingTimer'),
            transcript: document.getElementById('transcript'),
            emotionWord: document.getElementById('emotionWord'),
            submitEmotion: document.getElementById('submitEmotion'),
            selectedEmotion: document.getElementById('selectedEmotion'),
            exportBtn: document.getElementById('exportBtn'),
            clearBtn: document.getElementById('clearBtn'),
            themeToggle: document.getElementById('themeToggle'),
            soundToggle: document.getElementById('soundToggle')
        };
        
        this.init();
    }

    async init() {
        // Initialize storage
        await storage.init();
        
        // Initialize emotion wheel
        this.emotionWheel = new EmotionWheel('emotionWheel');
        this.emotionWheel.onSelect = (data) => {
            this.currentEmotionData = data;
            this.elements.selectedEmotion.textContent = `${data.emotion} (${data.intensityLevel})`;
            this.elements.emotionWord.value = data.emotion;
        };
        
        // Initialize visualization
        this.visualization = new VisualizationManager('traceWheel');
        await this.visualization.loadCaptures();
        
        // Setup transcription callbacks
        this.transcription.onTranscriptUpdate = (text) => {
            this.elements.transcript.textContent = text || 'Listening...';
        };
        
        this.transcription.onTranscriptComplete = (text) => {
            this.currentTranscript = text;
        };
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check browser support
        this.checkBrowserSupport();
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.submitEmotion.addEventListener('click', () => this.submitEmotion());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.clearBtn.addEventListener('click', () => this.clearData());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
        
        // Allow Enter key to submit emotion
        this.elements.emotionWord.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitEmotion();
            }
        });
        
        // Auto-map emotion word to wheel
        this.elements.emotionWord.addEventListener('input', (e) => {
            const word = e.target.value.trim();
            if (word) {
                const emotionData = this.emotionWheel.selectByWord(word);
                this.currentEmotionData = emotionData;
                this.elements.selectedEmotion.textContent = `${emotionData.emotion} (${emotionData.intensityLevel})`;
            }
        });
    }

    checkBrowserSupport() {
        if (!this.transcription.isSupported()) {
            this.updateStatus('⚠️ Speech recognition not supported in this browser. Transcription will not work.', 'warning');
        }
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('emotionRecorderTheme');
        if (savedTheme === 'dark') {
            this.applyDarkMode();
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            document.body.classList.remove('dark-mode');
            this.elements.themeToggle.innerHTML = '<span class="theme-icon">◐</span> X-Ray Mode';
            localStorage.setItem('emotionRecorderTheme', 'light');
        } else {
            this.applyDarkMode();
        }
        
        // Redraw emotion wheels with new theme
        if (this.emotionWheel) {
            this.emotionWheel.updateTheme();
        }
        if (this.visualization) {
            this.visualization.draw();
        }
    }

    applyDarkMode() {
        document.body.classList.add('dark-mode');
        this.elements.themeToggle.innerHTML = '<span class="theme-icon">☀</span> Light Mode';
        localStorage.setItem('emotionRecorderTheme', 'dark');
    }

    toggleSound() {
        const enabled = soundManager.toggleSound();
        if (enabled) {
            this.elements.soundToggle.innerHTML = '<span class="sound-icon">🔔</span> Sound';
            soundManager.playTick(); // Test sound
        } else {
            this.elements.soundToggle.innerHTML = '<span class="sound-icon">🔕</span> Muted';
        }
    }

    async start() {
        // Request camera/microphone permissions
        const hasPermission = await this.recorder.requestPermissions();
        if (!hasPermission) {
            this.updateStatus('❌ Camera/microphone access denied', 'error');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Update UI
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        this.elements.stopBtn.disabled = false;
        
        this.updateStatus('✓ Running - Next capture in 5 minutes');
        
        // Start countdown
        this.startCountdown();
    }

    pause() {
        if (this.isPaused) {
            // Resume
            this.isPaused = false;
            this.elements.pauseBtn.textContent = 'Pause';
            this.updateStatus('✓ Running - Next capture in ' + this.elements.countdown.textContent);
            this.startCountdown();
        } else {
            // Pause
            this.isPaused = true;
            this.elements.pauseBtn.textContent = 'Resume';
            this.updateStatus('⏸ Paused');
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
            }
            // Stop ticking when paused
            soundManager.stopCountdownTicking();
        }
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
        }
        
        // Stop any ticking sounds
        soundManager.stopCountdownTicking();
        
        this.recorder.stopStream();
        
        // Reset UI
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.stopBtn.disabled = true;
        this.elements.pauseBtn.textContent = 'Pause';
        this.elements.countdown.textContent = '5:00';
        
        this.updateStatus('Stopped');
    }

    startCountdown() {
        this.nextCaptureTime = Date.now() + this.intervalDuration;
        
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
        }
        
        // Start mechanical clock ticking
        soundManager.startCountdownTicking(
            Math.ceil((this.nextCaptureTime - Date.now()) / 1000),
            () => {
                const remaining = this.nextCaptureTime - Date.now();
                return Math.ceil(remaining / 1000);
            }
        );
        
        this.intervalTimer = setInterval(() => {
            if (this.isPaused) return;
            
            const remaining = this.nextCaptureTime - Date.now();
            
            if (remaining <= 0) {
                this.startCapture();
            } else {
                this.updateCountdown(remaining);
            }
        }, 100);
    }

    updateCountdown(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        this.elements.countdown.textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async startCapture() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
        }
        
        // Stop ticking and play buzzer alarm
        soundManager.stopCountdownTicking();
        soundManager.playBuzzer();
        
        // Wait for buzzer to finish, then play chime
        setTimeout(() => {
            soundManager.playChime();
        }, 1600);
        
        this.updateStatus('🎥 Recording 30 seconds...');
        
        // Show recording section
        this.elements.recordingSection.style.display = 'block';
        this.elements.transcript.textContent = 'Listening...';
        
        // Start transcription
        this.transcription.start();
        
        // Start recording
        const success = await this.recorder.startRecording(
            this.elements.videoPreview,
            (timeRemaining) => {
                this.elements.recordingTimer.textContent = timeRemaining;
            }
        );
        
        if (!success) {
            this.updateStatus('❌ Recording failed', 'error');
            this.elements.recordingSection.style.display = 'none';
            this.startCountdown();
            return;
        }
        
        // Setup recording complete callback
        this.recorder.onRecordingComplete = (blob) => {
            this.onRecordingComplete(blob);
        };
    }

    onRecordingComplete(videoBlob) {
        // Stop transcription
        this.transcription.stop();
        
        // Store video blob for later saving
        this.currentVideoBlob = videoBlob;
        
        // Hide recording section
        this.elements.recordingSection.style.display = 'none';
        
        // Show emotion input section
        this.showEmotionInput();
    }

    showEmotionInput() {
        this.elements.emotionSection.style.display = 'block';
        this.elements.emotionWord.value = '';
        this.elements.emotionWord.focus();
        this.emotionWheel.reset();
        this.elements.selectedEmotion.textContent = '';
        this.currentEmotionData = null;
        
        this.updateStatus('💭 How are you feeling?');
    }

    async submitEmotion() {
        const emotionWord = this.elements.emotionWord.value.trim();
        
        if (!emotionWord) {
            alert('Please enter an emotion word');
            return;
        }
        
        // If user typed but didn't click wheel, map the word
        if (!this.currentEmotionData) {
            this.currentEmotionData = this.emotionWheel.selectByWord(emotionWord);
        }
        
        // Save capture data including video blob
        const captureData = {
            emotion: emotionWord,
            angle: this.currentEmotionData.angle,
            intensity: this.currentEmotionData.intensity,
            intensityLevel: this.currentEmotionData.intensityLevel,
            transcript: this.currentTranscript,
            videoBlob: this.currentVideoBlob // Save the video
        };
        
        await storage.saveCapture(captureData);
        
        // Update visualization
        await this.visualization.refresh();
        
        // Hide emotion section
        this.elements.emotionSection.style.display = 'none';
        
        // Reset for next capture
        this.currentTranscript = '';
        this.currentEmotionData = null;
        this.currentVideoBlob = null;
        
        this.updateStatus('✓ Moment preserved in memory. Next capture in 5 minutes');
        
        // Start next countdown
        if (this.isRunning) {
            this.startCountdown();
        }
    }

    async exportData() {
        const data = await storage.exportData();
        
        // Show export options
        const format = confirm('Export as JSON? (Cancel for CSV)');
        
        if (format) {
            storage.downloadAsJSON(data);
        } else {
            storage.downloadAsCSV(data.captures);
        }
        
        this.updateStatus('✓ Data exported');
    }

    async clearData() {
        if (!confirm('Are you sure you want to delete all captured data? This cannot be undone.')) {
            return;
        }
        
        await storage.deleteAllCaptures();
        await this.visualization.refresh();
        
        this.updateStatus('✓ All data cleared');
    }

    updateStatus(message, type = 'normal') {
        this.elements.status.textContent = message;
        
        if (type === 'error') {
            this.elements.status.style.color = '#dc3545';
        } else if (type === 'warning') {
            this.elements.status.style.color = '#ff8c00';
        } else {
            this.elements.status.style.color = '#666';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new EmotionRecorderApp();
});
