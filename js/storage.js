// IndexedDB Storage Manager
class StorageManager {
    constructor() {
        this.dbName = 'EmotionRecorderDB';
        this.dbVersion = 1;
        this.storeName = 'captures';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('emotion', 'emotion', { unique: false });
                    objectStore.createIndex('sessionId', 'sessionId', { unique: false });
                }
            };
        });
    }

    async saveCapture(captureData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            const data = {
                timestamp: Date.now(),
                sessionId: this.getSessionId(),
                ...captureData,
                // Store video blob if provided
                videoBlob: captureData.videoBlob || null
            };
            
            const request = objectStore.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllCaptures() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getCapturesByDateRange(startDate, endDate) {
        const allCaptures = await this.getAllCaptures();
        return allCaptures.filter(capture => 
            capture.timestamp >= startDate && capture.timestamp <= endDate
        );
    }

    async deleteAllCaptures() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportData() {
        const captures = await this.getAllCaptures();
        return {
            exportDate: new Date().toISOString(),
            totalCaptures: captures.length,
            captures: captures
        };
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('emotionRecorderSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('emotionRecorderSessionId', sessionId);
        }
        return sessionId;
    }

    downloadAsJSON(data, filename = 'emotion-data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadAsCSV(captures, filename = 'emotion-data.csv') {
        const headers = ['Timestamp', 'Date', 'Time', 'Emotion', 'Angle', 'Intensity', 'Transcript', 'Has Video'];
        const rows = captures.map(capture => {
            const date = new Date(capture.timestamp);
            return [
                capture.timestamp,
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                capture.emotion || '',
                capture.angle || '',
                capture.intensity || '',
                (capture.transcript || '').replace(/"/g, '""'),
                capture.videoBlob ? 'Yes' : 'No'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async getVideoBlob(captureId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(captureId);
            
            request.onsuccess = () => {
                const capture = request.result;
                resolve(capture ? capture.videoBlob : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    createVideoURL(videoBlob) {
        if (!videoBlob) return null;
        return URL.createObjectURL(videoBlob);
    }
}

// Create global instance
const storage = new StorageManager();
/* -----------------------------------------
   DATA MANAGEMENT: EXPORT / IMPORT / CLEAR
------------------------------------------*/

// ---- EXPORT ----
function exportAllToJson() {
  const dump = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    dump[key] = localStorage.getItem(key);
  }

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'emotion-recorder-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('exportBtn')?.addEventListener('click', exportAllToJson);

// ---- CLEAR ----
document.getElementById('clearBtn')?.addEventListener('click', () => {
  if (confirm('Delete all saved data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
});

// ---- IMPORT ----
async function importFromJsonFile(file) {
  const text = await file.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (err) {
    alert('Import failed: invalid JSON.');
    return;
  }

  // Store every key/value pair from the imported JSON
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  alert('Import complete! Reloading...');
  location.reload();
}

document.getElementById('importFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) importFromJsonFile(file);
});

