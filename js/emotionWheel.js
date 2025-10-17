// Emotion Wheel Manager - Based on Plutchik's Emotion Model
class EmotionWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.maxRadius = Math.min(this.centerX, this.centerY) - 10;
        
        // 8 primary emotions with colors (light mode)
        this.emotionsLight = [
            { name: 'Joy', color: '#FFD700', angle: 0 },
            { name: 'Trust', color: '#90EE90', angle: 45 },
            { name: 'Fear', color: '#2F4F4F', angle: 90 },
            { name: 'Surprise', color: '#87CEEB', angle: 135 },
            { name: 'Sadness', color: '#4169E1', angle: 180 },
            { name: 'Disgust', color: '#9370DB', angle: 225 },
            { name: 'Anger', color: '#DC143C', angle: 270 },
            { name: 'Anticipation', color: '#FF8C00', angle: 315 }
        ];
        
        // X-ray mode colors - glowing cyan/blue spectrum
        this.emotionsDark = [
            { name: 'Joy', color: '#00FFFF', angle: 0 },
            { name: 'Trust', color: '#00CED1', angle: 45 },
            { name: 'Fear', color: '#008B8B', angle: 90 },
            { name: 'Surprise', color: '#40E0D0', angle: 135 },
            { name: 'Sadness', color: '#4682B4', angle: 180 },
            { name: 'Disgust', color: '#9370DB', angle: 225 },
            { name: 'Anger', color: '#FF1493', angle: 270 },
            { name: 'Anticipation', color: '#00BFFF', angle: 315 }
        ];
        
        this.emotions = this.emotionsLight;
        
        // Intensity levels (from center outward)
        this.intensityLevels = [
            { name: 'mild', radius: 0.33 },
            { name: 'moderate', radius: 0.66 },
            { name: 'intense', radius: 1.0 }
        ];
        
        this.selectedPosition = null;
        this.onSelect = null;
        
        this.draw();
        this.setupInteraction();
    }

    draw() {
        const isDark = document.body.classList.contains('dark-mode');
        
        // Set background
        if (isDark) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw emotion segments
        this.emotions.forEach((emotion, index) => {
            const startAngle = (emotion.angle - 22.5) * Math.PI / 180;
            const endAngle = (emotion.angle + 22.5) * Math.PI / 180;
            
            // Draw three intensity levels for each emotion
            for (let i = 0; i < this.intensityLevels.length; i++) {
                const innerRadius = i === 0 ? 0 : this.intensityLevels[i - 1].radius * this.maxRadius;
                const outerRadius = this.intensityLevels[i].radius * this.maxRadius;
                
                // Calculate color intensity
                const alpha = isDark ? (0.3 + (i * 0.25)) : (0.4 + (i * 0.3));
                const color = this.hexToRgba(emotion.color, alpha);
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.centerX, this.centerY);
                this.ctx.arc(this.centerX, this.centerY, outerRadius, startAngle, endAngle);
                this.ctx.lineTo(this.centerX, this.centerY);
                this.ctx.fillStyle = color;
                this.ctx.fill();
                
                // Draw border with glow in dark mode
                if (isDark) {
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
                } else {
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowBlur = 0;
                }
                this.ctx.stroke();
            }
            
            // Draw emotion label
            const labelAngle = emotion.angle * Math.PI / 180;
            const labelRadius = this.maxRadius + 20;
            const labelX = this.centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = this.centerY + Math.sin(labelAngle) * labelRadius;
            
            if (isDark) {
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
            } else {
                this.ctx.fillStyle = '#333';
                this.ctx.shadowBlur = 0;
            }
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emotion.name, labelX, labelY);
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = isDark ? '#00FFFF' : '#333';
        if (isDark) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(0, 255, 255, 1)';
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw selected position if exists
        if (this.selectedPosition) {
            this.drawSelection(this.selectedPosition.x, this.selectedPosition.y);
        }
    }

    drawSelection(x, y) {
        const isDark = document.body.classList.contains('dark-mode');
        
        // Draw outer ring
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, 2 * Math.PI);
        this.ctx.strokeStyle = isDark ? '#00FFFF' : '#fff';
        this.ctx.lineWidth = 3;
        if (isDark) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'rgba(0, 255, 255, 1)';
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Draw inner dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.fillStyle = isDark ? '#00FFFF' : '#667eea';
        if (isDark) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(0, 255, 255, 1)';
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    setupInteraction() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const dx = x - this.centerX;
            const dy = y - this.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if click is within the wheel
            if (distance <= this.maxRadius) {
                this.selectedPosition = { x, y };
                
                // Calculate angle and intensity
                let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                if (angle < 0) angle += 360;
                
                const intensity = distance / this.maxRadius;
                
                // Find closest emotion
                const emotion = this.getEmotionFromAngle(angle);
                const intensityLevel = this.getIntensityLevel(intensity);
                
                this.draw();
                
                if (this.onSelect) {
                    this.onSelect({
                        emotion: emotion.name,
                        angle: angle,
                        intensity: intensity,
                        intensityLevel: intensityLevel,
                        color: emotion.color
                    });
                }
            }
        });
    }

    getEmotionFromAngle(angle) {
        let closestEmotion = this.emotions[0];
        let minDiff = Math.abs(this.angleDifference(angle, this.emotions[0].angle));
        
        for (let i = 1; i < this.emotions.length; i++) {
            const diff = Math.abs(this.angleDifference(angle, this.emotions[i].angle));
            if (diff < minDiff) {
                minDiff = diff;
                closestEmotion = this.emotions[i];
            }
        }
        
        return closestEmotion;
    }

    angleDifference(angle1, angle2) {
        let diff = angle1 - angle2;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return diff;
    }

    getIntensityLevel(intensity) {
        if (intensity < 0.33) return 'mild';
        if (intensity < 0.66) return 'moderate';
        return 'intense';
    }

    mapWordToEmotion(word) {
        word = word.toLowerCase().trim();
        
        // Emotion mapping dictionary
        const emotionMap = {
            'joy': ['joy', 'happy', 'joyful', 'delighted', 'cheerful', 'pleased', 'content', 'glad'],
            'trust': ['trust', 'trusting', 'accepting', 'secure', 'safe', 'confident'],
            'fear': ['fear', 'afraid', 'scared', 'anxious', 'worried', 'nervous', 'terrified'],
            'surprise': ['surprise', 'surprised', 'amazed', 'astonished', 'shocked', 'startled'],
            'sadness': ['sad', 'sadness', 'unhappy', 'depressed', 'melancholy', 'sorrowful', 'gloomy'],
            'disgust': ['disgust', 'disgusted', 'revolted', 'repulsed', 'aversion'],
            'anger': ['anger', 'angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated'],
            'anticipation': ['anticipation', 'excited', 'eager', 'hopeful', 'expectant', 'interested']
        };
        
        // Find matching emotion
        for (const [emotion, keywords] of Object.entries(emotionMap)) {
            if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
                const emotionData = this.emotions.find(e => e.name.toLowerCase() === emotion);
                return emotionData;
            }
        }
        
        // Default to joy if no match
        return this.emotions[0];
    }

    selectByWord(word) {
        const emotion = this.mapWordToEmotion(word);
        
        // Place at moderate intensity by default
        const angle = emotion.angle * Math.PI / 180;
        const radius = this.maxRadius * 0.66;
        
        const x = this.centerX + Math.cos(angle) * radius;
        const y = this.centerY + Math.sin(angle) * radius;
        
        this.selectedPosition = { x, y };
        this.draw();
        
        return {
            emotion: emotion.name,
            angle: emotion.angle,
            intensity: 0.66,
            intensityLevel: 'moderate',
            color: emotion.color
        };
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    reset() {
        this.selectedPosition = null;
        this.draw();
    }

    updateTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        this.emotions = isDark ? this.emotionsDark : this.emotionsLight;
        this.draw();
    }
}
