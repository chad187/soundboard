const {ipcRenderer} = require('electron')

let imageButton = document.getElementById("image")

function image() {
	if(imageButton.style.backgroundColor == "green") {
		ipcRenderer.send('toggle-image', false)
		imageButton.style.backgroundColor = 'red'
		return
	}
	ipcRenderer.send('toggle-image', true)
	imageButton.style.backgroundColor = 'green'
}

ipcRenderer.on('initialize', (event, settings) => {
	if (settings.isImage) imageButton.style.backgroundColor = 'green'
	else imageButton.style.backgroundColor = 'red'
})