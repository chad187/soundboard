// Use the electronAPI bridge from preload

let imageButton = document.getElementById("image")
let sampleButton = document.getElementById("sample")
let keyMapButton = document.getElementById("keyMap")
let credits = document.getElementById('credits')

window.onload = function() {
  setTimeout(() => {
  	while (credits.hasChildNodes()) {
    	credits.removeChild(credits.lastChild);
		}
  }, 30000)
};

// Expose functions to global scope for onclick handlers
window.openBrowser = function() {
	window.electronAPI.openExternal('https://youtu.be/9AJimznZddA')
}

window.handleChange = function(checkbox) {
    window.electronAPI.send('toggle-panel', checkbox.id, checkbox.checked)
}

window.minimize = function() {
	window.electronAPI.send('minimize')
}

window.closeApp = function() {
	window.electronAPI.send('close')
}

window.image = function() {
	if(imageButton.style.backgroundColor == "green") {
		window.electronAPI.send('toggle-image', false)
		imageButton.style.backgroundColor = 'red'
		return
	}
	window.electronAPI.send('toggle-image', true)
	imageButton.style.backgroundColor = 'green'
}

window.sample = function() {
	if(sampleButton.style.backgroundColor == "green") {
		window.electronAPI.send('toggle-sample', false)
		sampleButton.style.backgroundColor = 'red'
		return
	}
	window.electronAPI.send('toggle-sample', true)
	sampleButton.style.backgroundColor = 'green'
	keyMapButton.style.backgroundColor = 'red'
}

window.keyMap = function() {
	if(keyMapButton.style.backgroundColor == "green") {
		window.electronAPI.send('toggle-keyMap', false)
		keyMapButton.style.backgroundColor = 'red'
		return
	}
	window.electronAPI.send('toggle-keyMap', true)
	keyMapButton.style.backgroundColor = 'green'
	sampleButton.style.backgroundColor = 'red'
}

window.electronAPI.on('initialize', (settings) => {
	if (settings.isImage) imageButton.style.backgroundColor = 'green'
	else imageButton.style.backgroundColor = 'red'

	window.handleChange({id: 'left', checked: settings.left })
	document.getElementById("left").checked = settings.left
	window.handleChange({id: 'top', checked: settings.top })
	document.getElementById("top").checked = settings.top
	window.handleChange({id: 'right', checked: settings.right })
	document.getElementById("right").checked = settings.right

	sampleButton.style.backgroundColor = 'red'
})

window.electronAPI.on('force-red', () => {
	sampleButton.style.backgroundColor = 'red'
	keyMapButton.style.backgroundColor = 'red'
})