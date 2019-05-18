const {BrowserWindow} = require('electron')

function playMedia(soundFile = null, imageFile = null) {
	console.log(BrowserWindow)
  let panel = BrowserWindow.getParentWindow()
  panel.show()
  let audio = new Audio("./oneshallfall.mp3")
  audio.play()
  setTimeout((panel) => panel.hide(), 3000)
}