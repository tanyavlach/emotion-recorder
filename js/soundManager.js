// Sound Manager - Mechanical Clock Sounds
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.tickInterval = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    // Mechanical clock tick sound
    playTick() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Create oscillator for tick
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Sharp, short tick sound
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.01);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }

    // Louder tock sound (alternating with tick)
    playTock() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Slightly lower and louder for tock
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.015);
        
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        
        oscillator.start(now);
        oscillator.stop(now + 0.06);
    }

    // Countdown warning ticks (last 10 seconds)
    playWarningTick() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Higher pitched warning tick
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.02);
        
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }

    // Mechanical buzzer alarm
    playBuzzer() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 1.5;
        
        // Create multiple oscillators for rich buzzer sound
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Buzzer frequencies with slight detuning
            const baseFreq = 440 + (i * 50);
            oscillator.frequency.setValueAtTime(baseFreq, now);
            
            // Vibrato effect
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.value = 6; // 6 Hz vibrato
            lfoGain.gain.value = 20; // Vibrato depth
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            // Envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
            gainNode.gain.setValueAtTime(0.15, now + duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
            lfo.start(now);
            lfo.stop(now + duration);
        }
    }

    // Bell chime for recording start
    playChime() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Create bell-like sound with multiple harmonics
        const frequencies = [523.25, 659.25, 783.99]; // C, E, G chord
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, now);
            
            const delay = index * 0.1;
            gainNode.gain.setValueAtTime(0, now + delay);
            gainNode.gain.linearRampToValueAtTime(0.2, now + delay + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.5);
            
            oscillator.start(now + delay);
            oscillator.stop(now + delay + 1.5);
        });
    }

    // Start countdown ticking (every second)
    startCountdownTicking(secondsRemaining, onTick) {
        this.stopCountdownTicking();
        
        let isTick = true;
        let lastSeconds = secondsRemaining;
        
        this.tickInterval = setInterval(() => {
            const seconds = onTick();
            
            if (seconds !== lastSeconds) {
                if (seconds <= 10 && seconds > 0) {
                    // Warning ticks in last 10 seconds
                    this.playWarningTick();
                } else if (seconds > 10) {
                    // Alternating tick-tock
                    if (isTick) {
                        this.playTick();
                    } else {
                        this.playTock();
                    }
                    isTick = !isTick;
                }
                lastSeconds = seconds;
            }
        }, 1000);
    }

    stopCountdownTicking() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    // Toggle sound on/off
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }
}

// Create global instance
const soundManager = new SoundManager();
