# Emotion Recording Tool

A web-based application that captures your emotional journey by recording 30-second video clips every 5 minutes, transcribing speech to text, and mapping emotions to a color wheel for visualization.

## Features

- **Automated Recording**: Captures 30 seconds of video from your webcam every 5 minutes
- **Live Transcription**: Uses Web Speech API to transcribe audio in real-time
- **Emotion Color Wheel**: Interactive emotion wheel based on Plutchik's 8 primary emotions
- **Emotion Tracking**: Visualizes your emotional journey over time with a trace on the emotion wheel
- **Timeline View**: See all your captures in chronological order
- **Statistics**: Track patterns in your emotional states
- **Data Export**: Export your data as JSON or CSV
- **Privacy-First**: All processing happens locally in your browser

## Getting Started

### Requirements

- Modern web browser (Chrome, Edge, or Safari recommended)
- Webcam and microphone
- HTTPS connection (required for camera/microphone access)

### Installation

1. Download or clone this repository
2. Open `index.html` in a web browser
3. For local testing, you can use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```
4. Navigate to `http://localhost:8000` in your browser

### Usage

1. **Start Recording**: Click the "Start" button to begin
2. **Grant Permissions**: Allow camera and microphone access when prompted
3. **Wait for Capture**: The timer counts down 5 minutes between captures
4. **Recording**: Every 5 minutes, a 30-second recording begins automatically
5. **Describe Emotion**: After recording, enter one word describing your emotion
6. **Select on Wheel**: Click on the emotion wheel or let it auto-map your word
7. **Submit**: Click "Submit" to save your capture
8. **View Journey**: See your emotional trace on the visualization dashboard

### Controls

- **Start**: Begin the recording cycle
- **Pause/Resume**: Pause the countdown timer
- **Stop**: Stop the recording cycle and release camera
- **Export Data**: Download your captures as JSON or CSV
- **Clear All Data**: Delete all stored captures

## Emotion Wheel

The emotion wheel is based on Plutchik's model with 8 primary emotions:

- **Joy** (Yellow) - 0°
- **Trust** (Green) - 45°
- **Fear** (Dark Green) - 90°
- **Surprise** (Light Blue) - 135°
- **Sadness** (Blue) - 180°
- **Disgust** (Purple) - 225°
- **Anger** (Red) - 270°
- **Anticipation** (Orange) - 315°

Each emotion has three intensity levels:
- **Mild** (inner ring)
- **Moderate** (middle ring)
- **Intense** (outer ring)

## Data Storage

All data is stored locally in your browser using IndexedDB. Each capture includes:

- Timestamp
- Emotion word
- Emotion wheel position (angle and intensity)
- Audio transcript
- Session ID

## Browser Compatibility

### Fully Supported
- Chrome/Edge (latest)
- Safari (latest)

### Limited Support
- Firefox (video recording works, speech recognition may not)

### Required Features
- MediaRecorder API (video recording)
- getUserMedia API (camera/microphone access)
- Web Speech API (transcription)
- IndexedDB (data storage)
- Canvas API (emotion wheel visualization)

## Privacy & Security

- **No Server**: Everything runs in your browser
- **No Upload**: Videos are discarded after transcription
- **Local Storage**: All data stays on your device
- **No Tracking**: No analytics or external connections

## Troubleshooting

### Camera/Microphone Not Working
- Ensure you've granted permissions in your browser
- Check that no other application is using the camera
- Try refreshing the page

### Speech Recognition Not Working
- Speech recognition requires Chrome, Edge, or Safari
- Ensure microphone permissions are granted
- Speak clearly during the 30-second recording

### Timer Not Starting
- Check browser console for errors
- Ensure JavaScript is enabled
- Try a different browser

## Technical Details

### File Structure
```
emotion-recorder/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Styling
├── js/
│   ├── app.js             # Main application controller
│   ├── recorder.js        # Video recording logic
│   ├── transcription.js   # Speech recognition
│   ├── emotionWheel.js    # Emotion wheel interaction
│   ├── storage.js         # IndexedDB management
│   └── visualization.js   # Data visualization
└── README.md              # This file
```

### Technologies Used
- HTML5 Canvas for emotion wheel rendering
- MediaRecorder API for video capture
- Web Speech API for transcription
- IndexedDB for data persistence
- Vanilla JavaScript (no frameworks)

## Future Enhancements

Potential features for future versions:
- Custom capture intervals
- Emotion intensity adjustment
- Video playback of captures
- Advanced analytics and insights
- Multi-language support
- Cloud backup option
- Mobile app version

## License

This project is open source and available for personal use.

## Support

For issues or questions, please check the browser console for error messages and ensure all requirements are met.
