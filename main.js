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

  // Open the DevTools.
  // transparentScreen.webContents.openDevTools()

  // Emitted when the window is closed.
  transparentScreen.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    transparentScreen = null
  })

  ipcMain.on('show-image', () => {
    transparentScreen.show()
    setTimeout(() => transparentScreen.hide(), 3500)
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
