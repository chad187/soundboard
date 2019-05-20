const {ipcRenderer} = require('electron')

function playMedia(button) {
	ipcRenderer.send('show-image')
	let pressed = document.getElementById(button)
  let audio = new Audio(pressed.src)
  console.log(pressed)
  audio.play()
}

let dropZone = document.getElementById('drop1');

// Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
dropZone.addEventListener('dragover', function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

// Get file data on drop
dropZone.addEventListener('drop', function(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // Array of all files
  let images = ['gif', 'jpg', 'jpeg']
  let sounds = ['mp3', 'mp4']

  for (var i=0, file; file=files[i]; i++) {
  	let extension = file.path.split('.')[1] //this is error prone way
  	if (images.indexOf(extension) !== -1) {
  		alert("image")
  	}
  	else if (sounds.indexOf(extension) !== -1) {
  		e.srcElement.src = file.path
  		console.log(e)
  		ipcRenderer.send('show-prompt', e.srcElement.textContent)
  	}
   }
})

ipcRenderer.on('return-prompt', (event, name) => {
	console.log(dropZone, name)
	dropZone.firstChild.data = name
	// document.getElementById('drop1').value = name;
})