const {ipcRenderer} = require('electron')
let os = require('os')
const Dialogs = require('dialogs')
const dialogs = Dialogs()
let dropZone = document.getElementById('image')

ipcRenderer.on('show-prompt', (event, text, side, id) => {
	let splitter = os.platform() == 'darwin' ? "/" : "\\"
  dialogs.prompt('Give it a name', text.slice(0, -4).split(splitter).pop(), ok => {
		ipcRenderer.send('return-prompt', ok, side, id)
	})
});

ipcRenderer.on('change-image', (event, file) => {
	dropZone.src = file
});
