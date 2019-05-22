const {ipcRenderer} = require('electron')

let drop0 = document.getElementById('drop0');
let drop1 = document.getElementById('drop1');
let drop2 = document.getElementById('drop2');
let drop3 = document.getElementById('drop3');
let drop4 = document.getElementById('drop4');
let drop5 = document.getElementById('drop5');
let drop6 = document.getElementById('drop6');
let drop7 = document.getElementById('drop7');
let drop8 = document.getElementById('drop8');
let drop9 = document.getElementById('drop9');

// Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
drop0.addEventListener('dragover', function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

// Get file data on drop
drop0.addEventListener('drop', function(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // Array of all files
  let images = ['gif', 'jpg', 'jpeg']
  let sounds = ['mp3', 'mp4']

  for (var i=0, file; file=files[i]; i++) {
  	let extension = file.path.split('.')[1] //this is error prone way
  	if (images.indexOf(extension) !== -1) {
  		ipcRenderer.send('change-image', file.path)
  	}
  	else if (sounds.indexOf(extension) !== -1) {
  		e.srcElement.src = file.path
  		ipcRenderer.send('show-prompt', e.srcElement)
  	}
   }
})

function playMedia(button) {
	let pressed = document.getElementById(button)
	console.log(pressed.src, pressed.alt)
	ipcRenderer.send('show-image', pressed.alt)
  let audio = new Audio(pressed.src)
  audio.play()
}

ipcRenderer.on('return-prompt', (event, name) => {
	drop0.firstChild.data = name
	// document.getElementById('drop1').value = name;
})

ipcRenderer.on('initialize', (event, settings) => {
	drop0.firstChild.data = settings.button0text
	drop0.src = settings.button0sound
	drop0.alt = settings.button0image

	drop1.firstChild.data = settings.button1text
	drop1.src = settings.button1sound
	drop1.alt = settings.button1image

	drop2.firstChild.data = settings.button2text
	drop2.src = settings.button2sound
	drop2.alt = settings.button2image

	drop3.firstChild.data = settings.button3text
	drop3.src = settings.button3sound
	drop3.alt = settings.button3image

	drop4.firstChild.data = settings.button4text
	drop4.src = settings.button4sound
	drop4.alt = settings.button4image

	drop5.firstChild.data = settings.button5text
	drop5.src = settings.button5sound
	drop5.alt = settings.button5image

	drop6.firstChild.data = settings.button6text
	drop6.src = settings.button6sound
	drop6.alt = settings.button6image

	drop7.firstChild.data = settings.button7text
	drop7.src = settings.button7sound
	drop7.alt = settings.button7image

	drop8.firstChild.data = settings.button8text
	drop8.src = settings.button8sound
	drop8.alt = settings.button8image

	drop9.firstChild.data = settings.button9text
	drop9.src = settings.button9sound
	drop9.alt = settings.button9image

})