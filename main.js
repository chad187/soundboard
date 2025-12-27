// Modules to control application life and create native browser window
const electron = require('electron')
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
let os = require('os')
const { uIOhook } = require('uiohook-napi')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let transparentScreen
let extendedTransparentScreen
let rightBar
let leftBar
let bottomBar
let topBar

const storage = require('electron-json-storage')
storage.setDataPath(require("os").homedir() + '/Documents/soundboard/')

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

function createWindow () {
  // Create the browser window.
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
  let smallWidth = Math.floor(width * .05)
  let smallHeight = Math.floor(height * .07)
  let bottomWidth = width - 2 * smallWidth
  let osDependentHeight = os.platform() == 'darwin' ? height : Math.floor(height * .93)

  const preloadPath = path.join(__dirname, 'preload.js')

  // Common webPreferences for all windows
  const webPrefs = {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,  // Required for preload script to access Node.js APIs
    preload: preloadPath
  }

  bottomBar = new BrowserWindow({
    webPreferences: webPrefs,
    width: bottomWidth,
    height: smallHeight,
    frame: false,
    x: smallWidth,
    y: osDependentHeight
  })

  rightBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: webPrefs,
    width: smallWidth,
    height: height,
    frame: false,
    x: width - smallWidth,
    y: 0
  })

  leftBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: webPrefs,
    width: smallWidth,
    height: height,
    frame: false,
    x: 0,
    y: 0
  })

  transparentScreen = new BrowserWindow({
    parent: bottomBar,
    webPreferences: webPrefs,
    width: Math.floor(width * .5),
    height: Math.floor(height * .6),
    transparent:true,
    frame: false,
    show: false,
    x: Math.floor(width * .25),
    y: Math.floor(height * .2)
  })

  topBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: webPrefs,
    width: bottomWidth,
    height: Math.floor(smallHeight * 1.425),
    frame: false,
    x: smallWidth,
    y: 0
  })

  let electronScreen = electron.screen;
  let displays = electronScreen.getAllDisplays();
  let externalDisplay = null;
  for (var i in displays) {
    if (displays[i].bounds.x != 0 || displays[i].bounds.y != 0) {
      externalDisplay = displays[i];
      break;
    }
  }

  if (externalDisplay) {
    const extBounds = externalDisplay.bounds
    const scaleFactor = externalDisplay.scaleFactor || 1
    // Divide by scaleFactor to get the actual pixel values Electron will use
    const winWidth = Math.floor(extBounds.width * 0.5 / scaleFactor)
    const winHeight = Math.floor(extBounds.height * 0.6 / scaleFactor)
    // Calculate center position (also adjusted for scale)
    const centerX = Math.floor(extBounds.x + (extBounds.width * 0.25 / scaleFactor))
    const centerY = Math.floor(extBounds.y + (extBounds.height * 0.2 / scaleFactor))

    console.log('[DEBUG] External display bounds:', extBounds)
    console.log('[DEBUG] External display scaleFactor:', scaleFactor)
    console.log('[DEBUG] Window size (scaled):', winWidth, 'x', winHeight)
    console.log('[DEBUG] Window position (scaled):', centerX, ',', centerY)

    extendedTransparentScreen = new BrowserWindow({
      webPreferences: webPrefs,
      width: winWidth,
      height: winHeight,
      x: centerX,
      y: centerY,
      transparent: true,
      frame: false,
      show: false,
      skipTaskbar: true
    })

    console.log('[DEBUG] Actual window bounds:', extendedTransparentScreen.getBounds())
  }

  rightBar.loadFile(path.join(__dirname, 'rightBar', 'index.html'))
  leftBar.loadFile(path.join(__dirname, 'leftBar', 'index.html'))
  topBar.loadFile(path.join(__dirname, 'topBar', 'index.html'))
  bottomBar.loadFile(path.join(__dirname, 'bottomBar', 'index.html'))
  transparentScreen.loadFile(path.join(__dirname, 'transparentScreen', 'index.html'))

  if (os.platform() == 'darwin') app.dock.hide()

  transparentScreen.setAlwaysOnTop(true, 'floating')
  transparentScreen.setVisibleOnAllWorkspaces(true)
  transparentScreen.setFullScreenable(false)

  if(extendedTransparentScreen) {
    extendedTransparentScreen.loadFile(path.join(__dirname, 'transparentScreen', 'index.html'))
    extendedTransparentScreen.setAlwaysOnTop(true, 'floating')
    extendedTransparentScreen.setVisibleOnAllWorkspaces(true)
    extendedTransparentScreen.setFullScreenable(false)
    extendedTransparentScreen.on('closed', function () {
    extendedTransparentScreen = null
  })
  }

  rightBar.setAlwaysOnTop(true, 'floating')
  rightBar.setVisibleOnAllWorkspaces(true)
  rightBar.setFullScreenable(false)

  leftBar.setAlwaysOnTop(true, 'floating')
  leftBar.setVisibleOnAllWorkspaces(true)
  leftBar.setFullScreenable(false)

  topBar.setAlwaysOnTop(true, 'floating')
  topBar.setVisibleOnAllWorkspaces(true)
  topBar.setFullScreenable(false)

  bottomBar.setAlwaysOnTop(true, 'floating');
  bottomBar.setVisibleOnAllWorkspaces(true)
  bottomBar.setFullScreenable(false)

  if (os.platform() == 'darwin') app.dock.show()

  initializeDB()

  // Open the DevTools for debugging
  //bottomBar.webContents.openDevTools({ mode: 'detach' })

  // Emitted when the window is closed.
  transparentScreen.on('closed', function () {
    transparentScreen = null
  })

  ipcMain.on('show-image', (event, file) => {
    getSettings()
      .then(function (settings) {
        if (settings.bottom.isImage) {
          transparentScreen.webContents.send('change-image', file)
          transparentScreen.show()
          if (extendedTransparentScreen) {
            extendedTransparentScreen.webContents.send('change-image', file)
            extendedTransparentScreen.show()
          }
          setTimeout(() => {
            transparentScreen.hide()
            if (extendedTransparentScreen) extendedTransparentScreen.hide()
          }, 2500)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('show-prompt', (event, file, side, id) => {
    // Get default name from file path
    let splitter = os.platform() == 'darwin' ? "/" : "\\"
    let defaultName = file.slice(0, -4).split(splitter).pop()

    // Create a simple input dialog window - calculate center position
    const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize
    const promptWidth = 400
    const promptHeight = 200

    let promptWindow = new BrowserWindow({
      width: promptWidth,
      height: promptHeight,
      x: Math.floor((screenWidth - promptWidth) / 2),
      y: Math.floor((screenHeight - promptHeight) / 2),
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    promptWindow.loadFile(path.join(__dirname, 'prompt', 'index.html'))

    promptWindow.once('ready-to-show', () => {
      promptWindow.show()
      promptWindow.webContents.send('prompt-init', {
        title: 'Name this sound:',
        defaultName: defaultName,
        side: side,
        id: id,
        promptType: 'sound'
      })
    })

    ipcMain.once('prompt-response', (event, name, respSide, respId, promptType) => {
      promptWindow.close()
      if (name) {
        var temp = name.replace("\'", "");
        eval(`${respSide}Bar.webContents.send('return-prompt', '${temp}', '${respId}')`)
        getSettings()
          .then(function (settings) {
            eval(`settings.${respSide}.${respId}text = '${temp}'`)
            saveSettings(settings)
          })
          .catch(function (error) {
            console.log(error)
          })
      }
    })

    // Save the sound file path
    getSettings()
      .then(function (settings) {
        eval(`settings.${side}.${id}sound = ${String.raw`file`}`)
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('return-prompt', (event, name, side, id) => {
    transparentScreen.hide()
    if (extendedTransparentScreen) extendedTransparentScreen.hide()
    if(name) {
      var temp = name.replace("\'", "");
      eval(`${side}Bar.webContents.send('return-prompt', '${temp}', '${id}')`)
      getSettings()
        .then(function (settings) {
          eval(`settings.${side}.${id}text = '${temp}'`)  //works because it is not an address
          saveSettings(settings)
        })
        .catch(function (error) {
          console.log(error)
        })
    }
  })

  ipcMain.on('change-image', (event, file, side, id) => {
    // Get default name from file path
    let splitter = os.platform() == 'darwin' ? "/" : "\\"
    let defaultName = file.slice(0, -4).split(splitter).pop()

    // Create a simple input dialog window - calculate center position
    const { width: imgScreenWidth, height: imgScreenHeight } = electron.screen.getPrimaryDisplay().workAreaSize
    const imgPromptWidth = 400
    const imgPromptHeight = 200

    let promptWindow = new BrowserWindow({
      width: imgPromptWidth,
      height: imgPromptHeight,
      x: Math.floor((imgScreenWidth - imgPromptWidth) / 2),
      y: Math.floor((imgScreenHeight - imgPromptHeight) / 2),
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    promptWindow.loadFile(path.join(__dirname, 'prompt', 'index.html'))

    promptWindow.once('ready-to-show', () => {
      promptWindow.show()
      promptWindow.webContents.send('prompt-init', {
        title: 'Name this image:',
        defaultName: defaultName,
        side: side,
        id: id,
        promptType: 'image'
      })
    })

    ipcMain.once('prompt-response', (event, name, respSide, respId, promptType) => {
      promptWindow.close()
      if (name) {
        var temp = name.replace("\'", "");
        eval(`${respSide}Bar.webContents.send('return-prompt', '${temp}', '${respId}')`)
        getSettings()
          .then(function (settings) {
            eval(`settings.${respSide}.${respId}text = '${temp}'`)
            saveSettings(settings)
          })
          .catch(function (error) {
            console.log(error)
          })
      }
    })

    // Save the image file path
    getSettings()
      .then(function (settings) {
        eval(`settings.${side}.${id}image = ${String.raw`file`}`)
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('toggle-image', (event, isOn) => {
    getSettings()
      .then(function (settings) {
        settings.bottom.isImage = isOn
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('toggle-sample', (event, isOn) => {
    if (isOn) {
      leftBar.webContents.send('toggle-keyMap', false)
      rightBar.webContents.send('toggle-keyMap', false)
      topBar.webContents.send('toggle-keyMap', false)
    }
    leftBar.webContents.send('toggle-sample', isOn)
    rightBar.webContents.send('toggle-sample', isOn)
    topBar.webContents.send('toggle-sample', isOn)
  })

  ipcMain.on('toggle-keyMap', (event, isOn) => {
    if (isOn) {
      leftBar.webContents.send('toggle-sample', false)
      rightBar.webContents.send('toggle-sample', false)
      topBar.webContents.send('toggle-sample', false)
    }
    leftBar.webContents.send('toggle-keyMap', isOn)
    rightBar.webContents.send('toggle-keyMap', isOn)
    topBar.webContents.send('toggle-keyMap', isOn)
  })

  ipcMain.on('isSelected', (event, side)  => {
    if (side == 'top') {
      leftBar.webContents.send('selected-off', true)
      rightBar.webContents.send('selected-off', true)
      topBar.webContents.send('selected-off', false)
    }
    else if (side == 'right') {
      leftBar.webContents.send('selected-off', true)
      topBar.webContents.send('selected-off', true)
      rightBar.webContents.send('selected-off', false)
    }
    else if (side == 'left') {
      topBar.webContents.send('selected-off', true)
      rightBar.webContents.send('selected-off', true)
      leftBar.webContents.send('selected-off', false)
    }
  })

  ipcMain.on('force-red', (event) => {
    bottomBar.webContents.send('force-red')
  })

  ipcMain.on('save-keyMap', (event, side, keyMap) => {
    getSettings()
      .then(function (settings) {
        eval(`settings.${side}.keymap = ${keyMap}`)
        saveSettings(settings)
        if (side == 'left') {
          topBar.webContents.send('update-keymap', settings.left.keymap)
          rightBar.webContents.send('update-keymap', settings.left.keymap)
        }
        else if (side == 'right') {
          topBar.webContents.send('update-keymap', settings.right.keymap)
          leftBar.webContents.send('update-keymap', settings.right.keymap)
        }
        else if (side == 'top') {
          leftBar.webContents.send('update-keymap', settings.top.keymap)
          rightBar.webContents.send('update-keymap', settings.top.keymap)
        }

      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('clean-keyMap', (event, side, keyMap) => {
    getSettings()
      .then(function (settings) {
        eval(`settings.${side}.keymap = ${keyMap}`)
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('toggle-panel', (event, side, isChecked) => {
    if (isChecked) {
      eval(`${side}Bar.show()`)
    }
    else {
      eval(`${side}Bar.hide()`)
    }
    getSettings()
      .then(function (settings) {
        eval(`settings.bottom.${side} = ${isChecked}`)
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('minimize', (event) => {
    if (leftBar.isVisible()) leftBar.hide()
    if (rightBar.isVisible()) rightBar.hide()
    if (topBar.isVisible()) topBar.hide()
    bottomBar.minimize()
  })

  ipcMain.on('close', (event) => {
    app.quit()
  })

  bottomBar.on('restore', () => {
    getSettings()
      .then(function (settings) {
        if (settings.bottom.left) leftBar.show()
        if (settings.bottom.right) rightBar.show()
        if (settings.bottom.top) topBar.show()
      })
      .catch(function (error) {
        console.log(error)
      })
  })
}

function getSettings() {
  return new Promise(function (resolve, reject) {
    storage.get('soundBoardSettings', function(error, data) {
      if (error) reject(error)
      else if (isEmpty(data)) reject(new Error('DB does not exist!'))
      else resolve(data)
    })
  })
}

function saveSettings(toSave) {
  return new Promise(function (resolve, reject) {
    storage.set('soundBoardSettings', toSave, function(error) {
      if (error) reject(error)
      else resolve()
    })
  })
}

function sendInitialize(winName, win, settings) {
  // Check if DOM is already ready, if so send immediately
  // Otherwise wait for dom-ready event
  if (win.webContents.isLoading()) {
    win.webContents.once('dom-ready', () => {
      win.webContents.send('initialize', settings)
    })
  } else {
    win.webContents.send('initialize', settings)
  }
}

function initializeDB() {
  getSettings()
    .then(function (settings) {
      sendInitialize('leftBar', leftBar, settings.left || {})
      sendInitialize('rightBar', rightBar, settings.right || {})
      sendInitialize('topBar', topBar, settings.top || {})
      sendInitialize('bottomBar', bottomBar, settings.bottom || {})
    })
    .catch(function (error) {
      const defaultSettings = {
        left: {},
        right: {},
        top: {},
        bottom: {isImage: true, left: true, top: true, right: true}
      }
      saveSettings(defaultSettings).then(() => {
        sendInitialize('leftBar', leftBar, defaultSettings.left)
        sendInitialize('rightBar', rightBar, defaultSettings.right)
        sendInitialize('topBar', topBar, defaultSettings.top)
        sendInitialize('bottomBar', bottomBar, defaultSettings.bottom)
      }).catch(err => {
        console.error("[DEBUG] Failed to save default settings:", err)
      })
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (transparentScreen === null) createWindow()
})

// Global keyboard hook using uiohook-napi
// Track pressed keys to prevent key repeat from triggering multiple plays
const pressedKeys = new Set()

uIOhook.on('keydown', event => {
  // Escape key (keycode 1) stops all audio
  if (event.keycode === 1) {
    if (leftBar) leftBar.webContents.send('stop-all-audio')
    if (rightBar) rightBar.webContents.send('stop-all-audio')
    if (topBar) topBar.webContents.send('stop-all-audio')
    return
  }

  // Ignore key repeat (key already pressed)
  if (pressedKeys.has(event.keycode)) {
    return
  }
  pressedKeys.add(event.keycode)

  if (transparentScreen && !transparentScreen.isVisible()) {
    if (leftBar) leftBar.webContents.send('keyDown', event.keycode)
    if (rightBar) rightBar.webContents.send('keyDown', event.keycode)
    if (topBar) topBar.webContents.send('keyDown', event.keycode)
    if (bottomBar) bottomBar.webContents.send('keyDown')
  }
})

uIOhook.on('keyup', event => {
  pressedKeys.delete(event.keycode)
})

uIOhook.start()

// Clean up on app quit
app.on('before-quit', () => {
  uIOhook.stop()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
