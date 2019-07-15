const {ipcRenderer} = require('electron')
const Dialogs = require('dialogs')
const dialogs = Dialogs()
let dropZone = document.getElementById('image')

ipcRenderer.on('show-prompt', (event, text, side, id) => {
  dialogs.prompt('Give it a name', text.slice(0, -4).split("\\").pop(), ok => {
		ipcRenderer.send('return-prompt', ok, side, id)
	})
});

ipcRenderer.on('change-image', (event, file) => {
	console.log(file)
	console.log(dropZone.src)
	dropZone.src = file
	console.log(dropZone.src)
});
