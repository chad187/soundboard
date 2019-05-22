const {ipcRenderer} = require('electron')
const Dialogs = require('dialogs')
const dialogs = Dialogs()
let dropZone = document.getElementById('image')

ipcRenderer.on('show-prompt', (event, name) => {
  dialogs.prompt('Give it a name', name, ok => {
		ipcRenderer.send('return-prompt', ok)
	})
});

ipcRenderer.on('change-image', (event, file) => {
	dropZone.src = file
});

// document.getElementById("tester").src="./save.png";