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
// ===== DATA MANAGEMENT (IndexedDB-aware) =====

// Ensure the DB is ready before wiring UI
(async () => {
  try {
    await storage.init();
  } catch (e) {
    console.error('Failed to init storage:', e);
  }

  // EXPORT: use your existing exportData() + downloadAsJSON()
  const exportBtn = document.getElementById('exportBtn');
  exportBtn?.addEventListener('click', async () => {
    try {
      const payload = await storage.exportData(); // { exportDate, totalCaptures, captures: [...] }
      storage.downloadAsJSON(payload, 'emotion-recorder-export.json');
    } catch (e) {
      console.error(e);
      alert('Export failed. See console for details.');
    }
  });

  // CLEAR: use your deleteAllCaptures()
  const clearBtn = document.getElementById('clearBtn');
  clearBtn?.addEventListener('click', async () => {
    if (!confirm('Delete all saved data? This cannot be undone.')) return;
    try {
      await storage.deleteAllCaptures();
      location.reload();
    } catch (e) {
      console.error(e);
      alert('Clear failed. See console for details.');
    }
  });

  // IMPORT: read JSON, accept {captures:[...]} or a raw array [...],
  // strip ids (to avoid collisions), and save via saveCapture()
  const importEl = document.getElementById('importFile');

  async function importFromJsonFile(file) {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      alert('Import failed: invalid JSON.');
      return;
    }

    const captures =
      Array.isArray(data)            ? data :
      Array.isArray(data?.captures)  ? data.captures :
      [];

    if (!Array.isArray(captures) || captures.length === 0) {
      alert('Import file has no captures to import.');
      return;
    }

    // Save each capture. Remove id to let IndexedDB assign new ones.
    for (const raw of captures) {
      const cap = { ...raw };
      delete cap.id;

      // Blobs can’t be represented in JSON; if present, ignore or set null
      if (cap.videoBlob && typeof cap.videoBlob !== 'string') {
        cap.videoBlob = null;
      }

      // Preserve original timestamp if present. Your saveCapture spreads
      // captureData AFTER a default timestamp, so the original will win.
      await storage.saveCapture(cap);
    }

    alert('Import complete. Reloading…');
    location.reload();
  }

  importEl?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) importFromJsonFile(file);
  });
})();

  
