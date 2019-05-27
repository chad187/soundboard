const {ipcRenderer} = require('electron')

let imageButton = document.getElementById("image")
let sampleButton = document.getElementById("sample")

function image() {
	if(imageButton.style.backgroundColor == "green") {
		ipcRenderer.send('toggle-image', false)
		imageButton.style.backgroundColor = 'red'
		return
	}
	ipcRenderer.send('toggle-image', true)
	imageButton.style.backgroundColor = 'green'
}

function sample() {
	if(sampleButton.style.backgroundColor == "green") {
		ipcRenderer.send('toggle-sample', false)
		sampleButton.style.backgroundColor = 'red'
		return
	}
	ipcRenderer.send('toggle-sample', true)
	sampleButton.style.backgroundColor = 'green'
}

ipcRenderer.on('initialize', (event, settings) => {
	if (settings.isImage) imageButton.style.backgroundColor = 'green'
	else imageButton.style.backgroundColor = 'red'
	
	sampleButton.style.backgroundColor = 'red'
})