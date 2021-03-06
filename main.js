// Modules to control application life and create native browser window
const electron = require('electron')
const {app, BrowserWindow, ipcMain} = require('electron')
let os = require('os')
const ioHook = require('iohook')

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

  bottomBar = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
    frame: false,
    x: smallWidth,
    y: osDependentHeight
  })

  rightBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false,
    x: width - smallWidth,
    y: 0
  })

  leftBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false,
    x: 0,
    y: 0
  })

  transparentScreen = new BrowserWindow({
    parent: bottomBar,
    webPreferences: {
      nodeIntegration: true
    },
    transparent:true,
    frame: false,
    show: false,
    x: width * .25,
    y: height * .2
  })

  topBar = new BrowserWindow({
    parent: bottomBar,
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
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
    const { width, height } = externalDisplay.workAreaSize
    extendedTransparentScreen = new BrowserWindow({
      parent: bottomBar,
      webPreferences: {
        nodeIntegration: true
      },
      width: width,
      height: height,
      transparent:true,
      frame: false,
      show: false,
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y
    })
  }

  rightBar.loadURL('file://' + __dirname + '/rightBar/index.html')
  leftBar.loadURL('file://' + __dirname + '/leftBar/index.html')
  topBar.loadURL('file://' + __dirname + '/topBar/index.html')
  bottomBar.loadURL('file://' + __dirname + '/bottomBar/index.html')
  transparentScreen.loadURL('file://' + __dirname + '/transparentScreen/index.html')

  if (os.platform() == 'darwin') app.dock.hide()

  transparentScreen.setAlwaysOnTop(true, 'floating')
  transparentScreen.setVisibleOnAllWorkspaces(true)
  transparentScreen.setFullScreenable(false)

  if(extendedTransparentScreen) {
    extendedTransparentScreen.loadURL('file://' + __dirname + '/transparentScreen/index.html')
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

  // Open the DevTools.
  // transparentScreen.webContents.openDevTools()

  // Emitted when the window is closed.
  transparentScreen.on('closed', function () {
    transparentScreen = null
  })

  ipcMain.on('show-image', (event, file) => {
    getSettings
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
    transparentScreen.webContents.send('show-prompt', file, side, id);
    transparentScreen.show()
    if (extendedTransparentScreen) {
      extendedTransparentScreen.webContents.send('show-prompt', file, side, id);
      extendedTransparentScreen.show()
    }
    getSettings
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
      getSettings
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
    getSettings
      .then(function (settings) {
        eval(`settings.${side}.${id}image = ${String.raw`file`}`)
        saveSettings(settings)
      })
      .catch(function (error) {
        console.log(error)
      })
  })

  ipcMain.on('toggle-image', (event, isOn) => {
    getSettings
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
    getSettings
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
    getSettings
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
    getSettings
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
    getSettings
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

let getSettings = new Promise(
    function (resolve, reject) {
      storage.get('soundBoardSettings', function(error, data) {
        if (isEmpty(data)) reject(new Error('DB does not exist!'))
        else if (error) reject(error)
        else resolve(data)
      })
    }
)

function saveSettings(toSave) {
  storage.set('soundBoardSettings', toSave, function(error) {
    if (error) throw error
  });
}

function initializeDB() {
  getSettings
    .then(function (resolve) {
      leftBar.webContents.once('dom-ready', () => {
        leftBar.webContents.send('initialize', resolve.left)
      })
      rightBar.webContents.once('dom-ready', () => {
        rightBar.webContents.send('initialize', resolve.right)
      })
      topBar.webContents.once('dom-ready', () => {
        topBar.webContents.send('initialize', resolve.top)
      })
      bottomBar.webContents.once('dom-ready', () => {
        bottomBar.webContents.send('initialize', resolve.bottom)
      })
    })
    .catch(function (error) {
      console.log("Did not detect DB, creating a new one and quitting. Here is actual error: ", error)
      saveSettings({left: {}, right: {}, top: {}, bottom: {isImage:true, left:true, top:true, right :true}})
      app.quit()
      app.relaunch()
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

ioHook.on('keydown', event => {
  if (!transparentScreen.isVisible()) {  //maybe I don't want this, no keymap while image is on
    leftBar.webContents.send('keyDown', event.rawcode)
    rightBar.webContents.send('keyDown', event.rawcode)
    topBar.webContents.send('keyDown', event.rawcode)
    bottomBar.webContents.send('keyDown')
  }
})

ioHook.start();

function checkMap(keycode, settings) {
  if (settins.keyMaps) {
    for (var [id, code] of settings.keyMaps) {
      if (value == event.code) {

        return
      }
    }
  }

  settings.keyMaps = new Map()

  leftBar.webContents.send('keyDown', event.keycode)
  rightBar.webContents.send('keyDown', event.keycode)
  topBar.webContents.send('keyDown', event.keycode)
}
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
