const {ipcRenderer} = require('electron')
const Dialogs = require('dialogs')
const dialogs = Dialogs()

ipcRenderer.on('show-prompt', (event, name) => {
  dialogs.prompt('Give it a name', name, ok => {
		ipcRenderer.send('return-prompt', ok)
	})
});

// document.getElementById("tester").src="./save.png";