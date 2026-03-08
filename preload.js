const { contextBridge, ipcRenderer, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC Send methods
  send: (channel, ...args) => {
    const validChannels = [
      'toggle-panel', 'minimize', 'close', 'toggle-image', 'toggle-sample',
      'toggle-keyMap', 'show-image', 'show-prompt', 'return-prompt',
      'change-image', 'isSelected', 'save-keyMap', 'clean-keyMap', 'force-red'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  // IPC Receive methods
  on: (channel, callback) => {
    const validChannels = [
      'initialize', 'toggle-sample', 'toggle-keyMap', 'return-prompt',
      'keyDown', 'selected-off', 'update-keymap', 'force-red',
      'show-prompt', 'change-image', 'stop-all-audio'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args))
    }
  },

  // Shell methods
  openExternal: (url) => {
    shell.openExternal(url)
  },

  // File system methods for saving audio recordings
  saveAudioFile: (arrayBuffer) => {
    const fileName = path.join(os.homedir(), 'Desktop', Date.now() + '.aac')
    fs.writeFileSync(fileName, Buffer.from(new Uint8Array(arrayBuffer)))
    return fileName
  },

  logToTerminal: (msg) => ipcRenderer.send('print-this', msg),

  // Get platform info
  getPlatform: () => os.platform(),

  // Path utilities
  pathJoin: (...args) => path.join(...args),
  homedir: () => os.homedir()
})

// Keycode to letter mapping for uiohook-napi keycodes
// These are scancode values, NOT JavaScript keyboard event keycodes
const keyCodeMap = {
  // Special keys
  1: 'Esc', 14: 'Backspace', 15: 'Tab', 28: 'Enter', 29: 'Ctrl',
  42: 'Shift', 54: 'ShiftR', 56: 'Alt', 57: 'Space', 58: 'CapsLock',
  69: 'NumLock', 70: 'ScrollLock',
  // Numbers (top row)
  2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
  // Letters
  16: 'Q', 17: 'W', 18: 'E', 19: 'R', 20: 'T', 21: 'Y', 22: 'U', 23: 'I', 24: 'O', 25: 'P',
  30: 'A', 31: 'S', 32: 'D', 33: 'F', 34: 'G', 35: 'H', 36: 'J', 37: 'K', 38: 'L',
  44: 'Z', 45: 'X', 46: 'C', 47: 'V', 48: 'B', 49: 'N', 50: 'M',
  // Punctuation
  12: '-', 13: '=', 26: '[', 27: ']', 39: ';', 40: "'", 41: '`',
  43: '\\', 51: ',', 52: '.', 53: '/',
  // Function keys
  59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6',
  65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',
  // Numpad
  71: 'Num7', 72: 'Num8', 73: 'Num9', 74: 'Num-',
  75: 'Num4', 76: 'Num5', 77: 'Num6', 78: 'Num+',
  79: 'Num1', 80: 'Num2', 81: 'Num3',
  82: 'Num0', 83: 'Num.',
  55: 'Num*',
  // Extended keys
  3613: 'CtrlR', 3637: 'Num/', 3640: 'AltR',
  3655: 'Home', 3657: 'PageUp', 3663: 'End', 3665: 'PageDown',
  3666: 'Insert', 3667: 'Delete',
  3675: 'Meta', 3676: 'MetaR',
  57416: 'Up', 57419: 'Left', 57421: 'Right', 57424: 'Down'
}

contextBridge.exposeInMainWorld('keyCodeUtils', {
  keyCodeToLetter: (keycode) => {
    return keyCodeMap[keycode] || `Key${keycode}`
  }
})
