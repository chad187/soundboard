// Modules to control application life and create native browser window
const electron = require('electron')
const {app, BrowserWindow, ipcMain} = require('electron')
const Positioner = require('electron-positioner')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let transparentScreen
let rightBar
let leftBar
let bottomBar
let topBar

const storage = require('electron-json-storage');
storage.setDataPath(app.getAppPath())

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
  transparentScreen = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    transparent:true,
    frame: false,
    show: false
  })

  rightBar = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false
  })

  leftBar = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false
  })

  bottomBar = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
    frame: false
  })

  topBar = new BrowserWindow({
    // parent: transparentScreen,
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
    frame: false
  })

  rightBar.loadURL('file://' + __dirname + '/rightBar/index.html')
  leftBar.loadURL('file://' + __dirname + '/leftBar/index.html')
  topBar.loadURL('file://' + __dirname + '/topBar/index.html')
  bottomBar.loadURL('file://' + __dirname + '/bottomBar/index.html')
  transparentScreen.loadURL('file://' + __dirname + '/transparentScreen/index.html')

  transparentScreen.setAlwaysOnTop(true, 'screen');
  rightBar.setAlwaysOnTop(true, 'screen');
  leftBar.setAlwaysOnTop(true, 'screen');
  topBar.setAlwaysOnTop(true, 'screen');
  bottomBar.setAlwaysOnTop(true, 'screen');


  // and load the index.html of the app.
  // transparentScreen.loadFile('transparentScreen.html')
  transparentScreen.maximize()

  let rightPositioner = new Positioner(rightBar)
  let leftPositioner = new Positioner(leftBar)
  let topPositioner = new Positioner(topBar)
  let bottomPositioner = new Positioner(bottomBar)

  // Moves the window top right on the screen.
  rightPositioner.move('topRight')
  leftPositioner.move('topLeft')
  topPositioner.move('topCenter')
  bottomPositioner.move('bottomCenter')

  initializeDB()

  // Open the DevTools.
  // transparentScreen.webContents.openDevTools()

  // Emitted when the window is closed.
  transparentScreen.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    transparentScreen = null
  })

  ipcMain.on('show-image', (event, file) => {
    transparentScreen.webContents.send('change-image', file)
    transparentScreen.show()
    setTimeout(() => transparentScreen.hide(), 2500)
  })

  ipcMain.on('show-prompt', (event, name) => {
    transparentScreen.show()
    transparentScreen.webContents.send('show-prompt', name);
    getSettings
      .then(function (settings) {
        settings.left.button0sound = name.src
        saveSettings(settings)
      })
      .catch(function (error) {
      })
  })

  ipcMain.on('return-prompt', (event, name) => {
    transparentScreen.hide()
    leftBar.webContents.send('return-prompt', name)
    getSettings
      .then(function (settings) {
        settings.left.button0text = name
        saveSettings(settings)
      })
      .catch(function (error) {
      })
  })

  ipcMain.on('change-image', (event, file) => {
    transparentScreen.webContents.send('change-image', file)
    getSettings
      .then(function (settings) {
        settings.left.button0image = file
        saveSettings(settings)
      })
      .catch(function (error) {
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
    })
    .catch(function (error) {
      saveSettings({left: {}, right: {}, top: {}, other: {}})
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
