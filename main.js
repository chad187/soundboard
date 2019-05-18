// Modules to control application life and create native browser window
const electron = require('electron')
const {app, BrowserWindow} = require('electron')
const Positioner = require('electron-positioner')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let rightBar
let leftBar
let bottomBar
let topBar

function createWindow () {
  // Create the browser window.
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
  let smallWidth = Math.floor(width * .05)
  let smallHeight = Math.floor(height * .07)
  let bottomWidth = width - 2 * smallWidth 
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    transparent:true,
    frame: false,
    show: false
  })

  rightBar = new BrowserWindow({
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false
  })

  leftBar = new BrowserWindow({
    parent:mainWindow,
    webPreferences: {
      nodeIntegration: true
    },
    width: smallWidth,
    height: height,
    frame: false
  })

  bottomBar = new BrowserWindow({
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
    frame: false
  })

  topBar = new BrowserWindow({
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true
    },
    width: bottomWidth,
    height: smallHeight,
    frame: false
  })

  rightBar.loadURL('file://' + __dirname + '/rightBar.html')
  leftBar.loadURL('file://' + __dirname + '/leftBar.html')
  topBar.loadURL('file://' + __dirname + '/topBar.html')
  bottomBar.loadURL('file://' + __dirname + '/bottomBar.html')

  mainWindow.setAlwaysOnTop(true, 'screen');
  rightBar.setAlwaysOnTop(true, 'screen');
  leftBar.setAlwaysOnTop(true, 'screen');
  topBar.setAlwaysOnTop(true, 'screen');
  bottomBar.setAlwaysOnTop(true, 'screen');


  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  mainWindow.maximize()

  let rightPositioner = new Positioner(rightBar)
  let leftPositioner = new Positioner(leftBar)
  let topPositioner = new Positioner(topBar)
  let bottomPositioner = new Positioner(bottomBar)

  // Moves the window top right on the screen.
  rightPositioner.move('topRight')
  leftPositioner.move('topLeft')
  topPositioner.move('topCenter')
  bottomPositioner.move('bottomCenter')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
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
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
