var {ipcRenderer} = require('electron')

function playMedia(soundFile = null, imageFile = null) {
	ipcRenderer.send('show-image')
  let audio = new Audio("../oneshallfall.mp3")
  audio.play()
}