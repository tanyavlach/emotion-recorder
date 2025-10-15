// Video Recording Manager
class VideoRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.stream = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDuration = 30; // 30 seconds
        this.onRecordingComplete = null;
        this.onRecordingStart = null;
        this.recordingTimer = null;
        this.timeRemaining = this.recordingDuration;
    }

    async requestPermissions() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            
            if (error.name === 'NotAllowedError') {
                alert('Camera and microphone access denied. Please grant permissions to use this tool.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera or microphone found on this device.');
            } else {
                alert('Error accessing camera/microphone: ' + error.message);
            }
            
            return false;
        }
    }

    async startRecording(videoElement, onTimerUpdate) {
        if (!this.stream) {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) return false;
        }

        // Display video preview
        if (videoElement) {
            videoElement.srcObject = this.stream;
        }

        // Reset recorded chunks
        this.recordedChunks = [];
        this.timeRemaining = this.recordingDuration;

        // Create MediaRecorder
        try {
            const options = { mimeType: 'video/webm;codecs=vp9' };
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
                
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/webm';
                }
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.isRecording = false;
                
                if (this.recordingTimer) {
                    clearInterval(this.recordingTimer);
                    this.recordingTimer = null;
                }

                // Create blob from recorded chunks
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                
                if (this.onRecordingComplete) {
                    this.onRecordingComplete(blob);
                }
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;

            if (this.onRecordingStart) {
                this.onRecordingStart();
            }

            // Start countdown timer
            this.recordingTimer = setInterval(() => {
                this.timeRemaining--;
                
                if (onTimerUpdate) {
                    onTimerUpdate(this.timeRemaining);
                }

                if (this.timeRemaining <= 0) {
                    this.stopRecording();
                }
            }, 1000);

            return true;

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Error starting recording: ' + error.message);
            return false;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    getTimeRemaining() {
        return this.timeRemaining;
    }

    isCurrentlyRecording() {
        return this.isRecording;
    }

    // Download recorded video (optional - for testing)
    downloadRecording(blob, filename = 'recording.webm') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
