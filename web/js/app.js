// Soundboard Web App - Main Application Logic

// State
let isImageMode = false;
let isSampleMode = false;
let isKeyMapMode = false;
let selectedButton = null;
let playingAudio = [];
let mediaRecorder = null;
let extendedWindow = null;
let keyMaps = { left: new Map(), right: new Map(), top: new Map() };
let imageTimeout = null;

// BroadcastChannel for communicating with extended display
const channel = new BroadcastChannel('soundboard-channel');

// Listen for messages from extended display
channel.onmessage = (event) => {
  const { type } = event.data;
  if (type === 'image-hidden') {
    // Hide image in main display too
    const displayImg = document.getElementById('displayImage');
    displayImg.style.display = 'none';
    displayImg.src = '';
  }
};

// Initialize the app
async function init() {
  await Storage.init();
  const settings = await Storage.getSettings();

  // Initialize all buttons
  await initializeButtons(settings);

  // Setup event listeners
  setupControlButtons();
  setupPanelCheckboxes(settings);
  setupKeyboardShortcuts();
  setupDragAndDrop();

  console.log('Soundboard Web App initialized');
}

// Initialize buttons from settings
async function initializeButtons(settings) {
  const panels = ['left', 'right', 'top'];

  for (const panel of panels) {
    const panelSettings = settings[panel] || {};

    // Build keymap
    if (panelSettings.keymap) {
      keyMaps[panel] = new Map(panelSettings.keymap);
    }

    for (let i = 0; i < 10; i++) {
      const btnId = `${panel}-drop${i}`;
      const btn = document.getElementById(btnId);
      if (!btn) continue;

      // Set label
      const label = panelSettings[`drop${i}text`] || 'Empty';
      btn.querySelector('.label').textContent = label;

      // Set keymap display
      const keyCode = keyMaps[panel].get(`drop${i}`);
      if (keyCode) {
        btn.querySelector('.keymap').textContent = keyCodeToLetter(keyCode);
      }

      // Load and set background image
      const imageId = panelSettings[`drop${i}image`];
      if (imageId) {
        const fileData = await Storage.getFile(imageId);
        if (fileData) {
          const url = URL.createObjectURL(fileData.blob);
          btn.style.backgroundImage = `url('${url}')`;
          btn.dataset.imageUrl = url;
          btn.dataset.imageId = imageId;
        }
      }

      // Load audio reference
      const soundId = panelSettings[`drop${i}sound`];
      if (soundId) {
        btn.dataset.soundId = soundId;
      }

      // Add click handlers
      btn.addEventListener('mousedown', handleButtonPress);
      btn.addEventListener('mouseup', handleButtonRelease);
    }
  }
}

// Handle button press
async function handleButtonPress(e) {
  const btn = e.currentTarget;
  const panel = btn.dataset.panel;
  const dropId = btn.dataset.id;

  if (isSampleMode) {
    // Start recording
    btn.style.opacity = 0.1;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileId = `${panel}-${dropId}-audio-${Date.now()}`;
        await Storage.saveFile(fileId, audioBlob, 'audio');
        await Storage.updateButtonSettings(panel, dropId, 'sound', fileId);
        btn.dataset.soundId = fileId;

        // Prompt for name
        const name = prompt('Give it a name', 'New Sound');
        if (name) {
          btn.querySelector('.label').textContent = name;
          await Storage.updateButtonSettings(panel, dropId, 'text', name);
        }

        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorder.start();
    } catch (err) {
      console.error('Error recording:', err);
      btn.style.opacity = 1;
    }
  } else if (isKeyMapMode) {
    // Select button for key mapping
    if (selectedButton) {
      selectedButton.style.opacity = 1;
    }
    selectedButton = btn;
    btn.style.opacity = 0.1;
  } else {
    // Normal play mode
    if (isImageMode && btn.dataset.imageUrl) {
      showImage(btn.dataset.imageUrl);
    }

    if (btn.dataset.soundId) {
      const fileData = await Storage.getFile(btn.dataset.soundId);
      if (fileData) {
        const url = URL.createObjectURL(fileData.blob);
        const audio = new Audio(url);
        playingAudio.push(audio);
        audio.onended = () => {
          const idx = playingAudio.indexOf(audio);
          if (idx > -1) playingAudio.splice(idx, 1);
          URL.revokeObjectURL(url);
        };
        audio.play().catch(err => console.log('Audio play error:', err));
      }
    }
  }
}

// Handle button release
function handleButtonRelease(e) {
  const btn = e.currentTarget;

  if (isSampleMode && mediaRecorder) {
    btn.style.opacity = 1;
    mediaRecorder.stop();
    mediaRecorder = null;
    isSampleMode = false;
    document.getElementById('sampleBtn').style.backgroundColor = 'red';
  }
}

// Show image in center display and extended window
function showImage(url) {
  const displayImg = document.getElementById('displayImage');
  displayImg.src = url;
  displayImg.style.display = 'block';

  // Send to extended display
  channel.postMessage({ type: 'show-image', url: url });

  // Auto-hide after 2 seconds
  if (imageTimeout) {
    clearTimeout(imageTimeout);
  }
  imageTimeout = setTimeout(() => {
    hideImage();
  }, 2000);
}

// Hide image
function hideImage() {
  if (imageTimeout) {
    clearTimeout(imageTimeout);
    imageTimeout = null;
  }
  const displayImg = document.getElementById('displayImage');
  displayImg.style.display = 'none';
  displayImg.src = '';
  channel.postMessage({ type: 'hide-image' });
}

// Setup control buttons
function setupControlButtons() {
  const imageBtn = document.getElementById('imageBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const keyMapBtn = document.getElementById('keyMapBtn');
  const extendedBtn = document.getElementById('extendedBtn');
  const centerDisplay = document.getElementById('centerDisplay');
  const displayImage = document.getElementById('displayImage');

  // Click on center display or image to hide it
  centerDisplay.addEventListener('click', hideImage);
  displayImage.addEventListener('click', (e) => {
    e.stopPropagation();
    hideImage();
  });

  imageBtn.style.backgroundColor = 'red';
  sampleBtn.style.backgroundColor = 'red';
  keyMapBtn.style.backgroundColor = 'red';

  imageBtn.addEventListener('click', () => {
    isImageMode = !isImageMode;
    imageBtn.style.backgroundColor = isImageMode ? 'green' : 'red';
    Storage.getSettings().then(settings => {
      settings.bottom.isImage = isImageMode;
      Storage.saveSettings(settings);
    });
  });

  sampleBtn.addEventListener('click', () => {
    isSampleMode = !isSampleMode;
    sampleBtn.style.backgroundColor = isSampleMode ? 'green' : 'red';
    if (isSampleMode) {
      isKeyMapMode = false;
      keyMapBtn.style.backgroundColor = 'red';
    }
  });

  keyMapBtn.addEventListener('click', () => {
    isKeyMapMode = !isKeyMapMode;
    keyMapBtn.style.backgroundColor = isKeyMapMode ? 'green' : 'red';
    if (isKeyMapMode) {
      isSampleMode = false;
      sampleBtn.style.backgroundColor = 'red';
    } else if (selectedButton) {
      selectedButton.style.opacity = 1;
      selectedButton = null;
    }
  });

  extendedBtn.addEventListener('click', () => {
    if (extendedWindow && !extendedWindow.closed) {
      extendedWindow.focus();
    } else {
      extendedWindow = window.open('extended.html', 'SoundboardExtended',
        'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
    }
  });
}

// Setup panel checkboxes
function setupPanelCheckboxes(settings) {
  const leftCheck = document.getElementById('leftCheck');
  const topCheck = document.getElementById('topCheck');
  const rightCheck = document.getElementById('rightCheck');

  leftCheck.checked = settings.bottom.left !== false;
  topCheck.checked = settings.bottom.top !== false;
  rightCheck.checked = settings.bottom.right !== false;

  updatePanelVisibility();

  leftCheck.addEventListener('change', () => {
    Storage.updatePanelVisibility('left', leftCheck.checked);
    updatePanelVisibility();
  });

  topCheck.addEventListener('change', () => {
    Storage.updatePanelVisibility('top', topCheck.checked);
    updatePanelVisibility();
  });

  rightCheck.addEventListener('change', () => {
    Storage.updatePanelVisibility('right', rightCheck.checked);
    updatePanelVisibility();
  });
}

// Update panel visibility based on checkboxes
function updatePanelVisibility() {
  document.getElementById('leftBar').style.display =
    document.getElementById('leftCheck').checked ? 'flex' : 'none';
  document.getElementById('topBar').style.display =
    document.getElementById('topCheck').checked ? 'flex' : 'none';
  document.getElementById('rightBar').style.display =
    document.getElementById('rightCheck').checked ? 'flex' : 'none';
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', async (e) => {
    const keyCode = e.keyCode;

    // Escape to stop all audio
    if (keyCode === 27) {
      killAllAudio();
      hideImage();
      return;
    }

    // If in keymap mode and a button is selected
    if (isKeyMapMode && selectedButton) {
      const panel = selectedButton.dataset.panel;
      const dropId = selectedButton.dataset.id;

      // Remove this key from any existing mapping
      for (const [id, code] of keyMaps[panel]) {
        if (code === keyCode) {
          keyMaps[panel].delete(id);
          const oldBtn = document.getElementById(`${panel}-${id}`);
          if (oldBtn) oldBtn.querySelector('.keymap').textContent = '';
          break;
        }
      }

      // Set new mapping
      keyMaps[panel].set(dropId, keyCode);
      selectedButton.querySelector('.keymap').textContent = keyCodeToLetter(keyCode);
      selectedButton.style.opacity = 1;
      selectedButton = null;

      // Save keymap
      await Storage.updateKeymap(panel, [...keyMaps[panel]]);

      // Turn off keymap mode
      isKeyMapMode = false;
      document.getElementById('keyMapBtn').style.backgroundColor = 'red';
      return;
    }

    // Normal mode - check for mapped keys
    for (const panel of ['left', 'right', 'top']) {
      for (const [id, code] of keyMaps[panel]) {
        if (code === keyCode) {
          const btn = document.getElementById(`${panel}-${id}`);
          if (btn) {
            handleButtonPress({ currentTarget: btn });
          }
          return;
        }
      }
    }
  });
}


// Kill all playing audio
function killAllAudio() {
  playingAudio.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  playingAudio = [];
}

// Setup drag and drop for files
function setupDragAndDrop() {
  const buttons = document.querySelectorAll('.sound-btn');

  buttons.forEach(btn => {
    btn.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    btn.addEventListener('drop', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      const files = e.dataTransfer.files;
      const panel = btn.dataset.panel;
      const dropId = btn.dataset.id;

      const images = ['gif', 'jpg', 'jpeg', 'png', 'bmp'];
      const sounds = ['mp3', 'wma', 'wav', 'webm', 'ogg'];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop().toLowerCase();

        if (images.includes(extension)) {
          // Handle image
          const fileId = `${panel}-${dropId}-image-${Date.now()}`;
          await Storage.saveFile(fileId, file, 'image');
          await Storage.updateButtonSettings(panel, dropId, 'image', fileId);

          const url = URL.createObjectURL(file);
          btn.style.backgroundImage = `url('${url}')`;
          btn.dataset.imageUrl = url;
          btn.dataset.imageId = fileId;
        } else if (sounds.includes(extension)) {
          // Handle sound
          const fileId = `${panel}-${dropId}-audio-${Date.now()}`;
          await Storage.saveFile(fileId, file, 'audio');
          await Storage.updateButtonSettings(panel, dropId, 'sound', fileId);
          btn.dataset.soundId = fileId;

          // Prompt for name
          const defaultName = file.name.slice(0, -4);
          const name = prompt('Give it a name', defaultName);
          if (name) {
            btn.querySelector('.label').textContent = name;
            await Storage.updateButtonSettings(panel, dropId, 'text', name);
          }
        } else {
          alert('Unknown file type: ' + extension);
        }
      }
    });
  });
}

// Convert keycode to letter
function keyCodeToLetter(keyCode) {
  // Common key mappings
  if (keyCode >= 65 && keyCode <= 90) {
    return String.fromCharCode(keyCode);
  }
  if (keyCode >= 48 && keyCode <= 57) {
    return String.fromCharCode(keyCode);
  }
  if (keyCode >= 96 && keyCode <= 105) {
    return 'Num' + (keyCode - 96);
  }

  const specialKeys = {
    32: 'Space', 13: 'Enter', 9: 'Tab',
    16: 'Shift', 17: 'Ctrl', 18: 'Alt',
    37: '←', 38: '↑', 39: '→', 40: '↓',
    112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4',
    116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8',
    120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12'
  };

  return specialKeys[keyCode] || `Key${keyCode}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

