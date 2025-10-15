// Visualization Manager for Emotion Tracking
class VisualizationManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.maxRadius = Math.min(this.centerX, this.centerY) - 50;
        this.captures = [];
        
        // Emotion colors matching the emotion wheel
        this.emotionColors = {
            'Joy': '#FFD700',
            'Trust': '#90EE90',
            'Fear': '#2F4F4F',
            'Surprise': '#87CEEB',
            'Sadness': '#4169E1',
            'Disgust': '#9370DB',
            'Anger': '#DC143C',
            'Anticipation': '#FF8C00'
        };
    }

    async loadCaptures() {
        this.captures = await storage.getAllCaptures();
        this.draw();
        this.updateTimeline();
        this.updateStatistics();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background emotion wheel (lighter version)
        this.drawBackgroundWheel();
        
        // Draw emotion trace path
        if (this.captures.length > 0) {
            this.drawEmotionPath();
            this.drawEmotionPoints();
        }
        
        // Draw center
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
    }

    drawBackgroundWheel() {
        const emotions = [
            { name: 'Joy', angle: 0 },
            { name: 'Trust', angle: 45 },
            { name: 'Fear', angle: 90 },
            { name: 'Surprise', angle: 135 },
            { name: 'Sadness', angle: 180 },
            { name: 'Disgust', angle: 225 },
            { name: 'Anger', angle: 270 },
            { name: 'Anticipation', angle: 315 }
        ];

        emotions.forEach(emotion => {
            const startAngle = (emotion.angle - 22.5) * Math.PI / 180;
            const endAngle = (emotion.angle + 22.5) * Math.PI / 180;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.maxRadius, startAngle, endAngle);
            this.ctx.lineTo(this.centerX, this.centerY);
            this.ctx.fillStyle = this.hexToRgba(this.emotionColors[emotion.name], 0.1);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Draw label
            const labelAngle = emotion.angle * Math.PI / 180;
            const labelRadius = this.maxRadius + 25;
            const labelX = this.centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = this.centerY + Math.sin(labelAngle) * labelRadius;
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emotion.name, labelX, labelY);
        });
    }

    drawEmotionPath() {
        if (this.captures.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        for (let i = 0; i < this.captures.length; i++) {
            const capture = this.captures[i];
            const point = this.angleToPoint(capture.angle, capture.intensity);
            
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawEmotionPoints() {
        this.captures.forEach((capture, index) => {
            const point = this.angleToPoint(capture.angle, capture.intensity);
            const color = this.getEmotionColor(capture.emotion);
            
            // Draw outer ring
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw inner dot
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            
            // Draw sequence number
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((index + 1).toString(), point.x, point.y - 15);
        });
    }

    angleToPoint(angle, intensity) {
        const angleRad = angle * Math.PI / 180;
        const radius = intensity * this.maxRadius;
        
        return {
            x: this.centerX + Math.cos(angleRad) * radius,
            y: this.centerY + Math.sin(angleRad) * radius
        };
    }

    getEmotionColor(emotionName) {
        // Find closest matching emotion
        for (const [key, color] of Object.entries(this.emotionColors)) {
            if (emotionName && emotionName.toLowerCase().includes(key.toLowerCase())) {
                return color;
            }
        }
        return '#667eea'; // Default color
    }

    updateTimeline() {
        const timelineList = document.getElementById('timelineList');
        
        if (this.captures.length === 0) {
            timelineList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px; font-style: italic;">No moments captured yet. Begin your journey to see the path unfold...</p>';
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedCaptures = [...this.captures].sort((a, b) => b.timestamp - a.timestamp);
        
        timelineList.innerHTML = sortedCaptures.map((capture, index) => {
            const date = new Date(capture.timestamp);
            const color = this.getEmotionColor(capture.emotion);
            const hasVideo = capture.videoBlob ? true : false;
            const videoId = `video-${capture.id}`;
            
            return `
                <div class="timeline-item" style="border-left-color: ${color}" data-capture-id="${capture.id}">
                    <div class="timeline-time">${date.toLocaleString()}</div>
                    <div class="timeline-emotion" style="color: ${color}">${capture.emotion || 'Unknown'}</div>
                    <div class="timeline-transcript">${capture.transcript || 'Silent moment...'}</div>
                    ${hasVideo ? `
                        <div class="timeline-video-container" style="margin-top: 10px;">
                            <button class="btn-play-video" data-video-id="${videoId}" data-capture-id="${capture.id}" 
                                style="padding: 8px 16px; background: linear-gradient(135deg, #87CEEB 0%, #4682B4 100%); 
                                color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em;">
                                ▶ View This Moment
                            </button>
                            <div id="${videoId}" class="video-playback" style="display: none; margin-top: 10px;">
                                <video controls style="width: 100%; max-width: 400px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></video>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Add event listeners for video playback buttons
        document.querySelectorAll('.btn-play-video').forEach(button => {
            button.addEventListener('click', async (e) => {
                const captureId = parseInt(e.target.dataset.captureId);
                const videoId = e.target.dataset.videoId;
                await this.playVideo(captureId, videoId);
            });
        });
    }

    async playVideo(captureId, videoContainerId) {
        const videoContainer = document.getElementById(videoContainerId);
        const videoElement = videoContainer.querySelector('video');
        
        if (videoContainer.style.display === 'none') {
            // Load and play video
            const videoBlob = await storage.getVideoBlob(captureId);
            
            if (videoBlob) {
                const videoURL = storage.createVideoURL(videoBlob);
                videoElement.src = videoURL;
                videoContainer.style.display = 'block';
                
                // Clean up URL when video ends
                videoElement.addEventListener('ended', () => {
                    URL.revokeObjectURL(videoURL);
                });
            }
        } else {
            // Hide video
            videoContainer.style.display = 'none';
            videoElement.pause();
            if (videoElement.src) {
                URL.revokeObjectURL(videoElement.src);
                videoElement.src = '';
            }
        }
    }

    updateStatistics() {
        const statsContainer = document.getElementById('stats');
        
        if (this.captures.length === 0) {
            statsContainer.innerHTML = '<p style="text-align: center; color: #999;">No data yet</p>';
            return;
        }
        
        // Calculate statistics
        const totalCaptures = this.captures.length;
        
        // Count emotions
        const emotionCounts = {};
        this.captures.forEach(capture => {
            const emotion = capture.emotion || 'Unknown';
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
        
        // Find most common emotion
        const mostCommon = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        // Calculate average intensity
        const avgIntensity = this.captures.reduce((sum, c) => sum + (c.intensity || 0), 0) / totalCaptures;
        
        // Get session info
        const firstCapture = new Date(Math.min(...this.captures.map(c => c.timestamp)));
        const lastCapture = new Date(Math.max(...this.captures.map(c => c.timestamp)));
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalCaptures}</div>
                <div class="stat-label">Total Captures</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: ${this.getEmotionColor(mostCommon[0])}">${mostCommon[0]}</div>
                <div class="stat-label">Most Common Emotion</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(avgIntensity * 100).toFixed(0)}%</div>
                <div class="stat-label">Average Intensity</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${firstCapture.toLocaleDateString()}</div>
                <div class="stat-label">First Capture</div>
            </div>
        `;
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    async refresh() {
        await this.loadCaptures();
    }
}
