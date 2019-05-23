function loop() {
	if (document.getElementById("loop").style.backgroundColor == 'green') {
		ipcRenderer.send('toggle-loop', false)
		document.getElementById("loop").style.backgroundColor = "red";
		return
	}
	ipcRenderer.send('toggle-loop', true)
	document.getElementById("loop").style.backgroundColor = "green";
}

function image() {
	if(document.getElementById("image").style.backgroundColor == "green") {
		ipcRenderer.send('toggleimage', false)
		document.getElementById("image").style.backgroundColor = 'red'
		
	}
	ipcRenderer.send('toggle-image', true)
	document.getElementById("image").style.backgroundColor = 'green'
}