// Use the electronAPI bridge from preload
console.log('[DEBUG transparentScreen] Controller loaded, electronAPI:', window.electronAPI)

let dropZone = document.getElementById('image')

window.electronAPI.on('show-prompt', (text, side, id) => {
	let splitter = window.electronAPI.getPlatform() == 'darwin' ? "/" : "\\"
	let defaultName = text.slice(0, -4).split(splitter).pop()
	let name = prompt('Give it a name', defaultName)
	window.electronAPI.send('return-prompt', name, side, id)
})

window.electronAPI.on('change-image', (file) => {
	dropZone.src = file
})
