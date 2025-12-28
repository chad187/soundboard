// IndexedDB Storage for Soundboard Web App
const DB_NAME = 'SoundboardDB';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_SETTINGS = 'settings';

let db = null;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Store for audio/image files as blobs
      if (!database.objectStoreNames.contains(STORE_FILES)) {
        database.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
      
      // Store for settings
      if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
        database.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

// Save a file (audio or image) to IndexedDB
function saveFile(id, blob, type) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_FILES], 'readwrite');
    const store = transaction.objectStore(STORE_FILES);
    
    const data = {
      id: id,
      blob: blob,
      type: type,
      timestamp: Date.now()
    };
    
    const request = store.put(data);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// Get a file from IndexedDB
function getFile(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_FILES], 'readonly');
    const store = transaction.objectStore(STORE_FILES);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete a file from IndexedDB
function deleteFile(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_FILES], 'readwrite');
    const store = transaction.objectStore(STORE_FILES);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save settings to IndexedDB
function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    
    const data = {
      key: 'appSettings',
      value: settings,
      timestamp: Date.now()
    };
    
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get settings from IndexedDB
function getSettings() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('appSettings');
    
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value);
      } else {
        // Return default settings
        resolve(createDefaultSettings());
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Create default settings structure
function createDefaultSettings() {
  const defaultPanel = {};
  for (let i = 0; i < 10; i++) {
    defaultPanel[`drop${i}text`] = 'Empty';
    defaultPanel[`drop${i}sound`] = null;
    defaultPanel[`drop${i}image`] = null;
  }
  defaultPanel.keymap = [];
  
  return {
    left: { ...defaultPanel },
    right: { ...defaultPanel },
    top: { ...defaultPanel },
    bottom: {
      isImage: false,
      left: true,
      right: true,
      top: true
    }
  };
}

// Update a specific button's settings
function updateButtonSettings(panel, buttonId, property, value) {
  return getSettings().then(settings => {
    if (!settings[panel]) {
      settings[panel] = {};
    }
    settings[panel][`${buttonId}${property}`] = value;
    return saveSettings(settings);
  });
}

// Update panel visibility
function updatePanelVisibility(panel, visible) {
  return getSettings().then(settings => {
    settings.bottom[panel] = visible;
    return saveSettings(settings);
  });
}

// Update keymap for a panel
function updateKeymap(panel, keymap) {
  return getSettings().then(settings => {
    settings[panel].keymap = keymap;
    return saveSettings(settings);
  });
}

// Export for use in app.js
window.Storage = {
  init: initDB,
  saveFile,
  getFile,
  deleteFile,
  saveSettings,
  getSettings,
  updateButtonSettings,
  updatePanelVisibility,
  updateKeymap,
  createDefaultSettings
};

