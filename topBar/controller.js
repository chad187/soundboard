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
drop0.addEventListener('dragover', dragover)
drop1.addEventListener('dragover', dragover)
drop2.addEventListener('dragover', dragover)
drop3.addEventListener('dragover', dragover)
drop4.addEventListener('dragover', dragover)
drop5.addEventListener('dragover', dragover)
drop6.addEventListener('dragover', dragover)
drop7.addEventListener('dragover', dragover)
drop8.addEventListener('dragover', dragover)
drop9.addEventListener('dragover', dragover)

drop0.addEventListener('drop', drop)
drop1.addEventListener('drop', drop)
drop2.addEventListener('drop', drop)
drop3.addEventListener('drop', drop)
drop4.addEventListener('drop', drop)
drop5.addEventListener('drop', drop)
drop6.addEventListener('drop', drop)
drop7.addEventListener('drop', drop)
drop8.addEventListener('drop', drop)
drop9.addEventListener('drop', drop)

function dragover(e) {
	e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function drop(e) {
	e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // Array of all files
  let images = ['gif', 'jpg', 'jpeg']
  let sounds = ['mp3', 'mp4']

  for (var i=0, file; file=files[i]; i++) {
  	let extension = file.path.split('.')[1] //this is error prone way
  	if (images.indexOf(extension) !== -1) {
  		imagePath = file.path.replace(/\\/g, "\\\\")
  		if(e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.style.backgroundImage = `url('${imagePath}')`
  			ipcRenderer.send('change-image', file.path, "top", e.srcElement.parentNode.id)
  		}
  		else {
  			e.srcElement.style.backgroundImage = `url('${imagePath}')`
  			ipcRenderer.send('change-image', file.path, "top", e.srcElement.id)
  		}
  	}
  	else if (sounds.indexOf(extension) !== -1) {
  		if (e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.src = file.path
  			ipcRenderer.send('show-prompt', e.srcElement.data, "top", e.srcElement.parentNode.id)
  		}
  		else{
  			e.srcElement.src = file.path
  			ipcRenderer.send('show-prompt', e.srcElement.data, "top", e.srcElement.id)
  		}
  	}
  	else {
  		alert("Unknown file type")
  	}
   }
}

function playMedia(drop) {
	let pressed = document.getElementById(drop)
	ipcRenderer.send('show-image', pressed.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''))
  let audio = new Audio(pressed.src)
  audio.play()
}

function addSlashes(file) {
	return file.replace(/\\/g, "\\\\")
}

ipcRenderer.on('return-prompt', (event, name, id) => {
	eval(`${id}.children[0].firstChild.data = '${name}'`)
})

ipcRenderer.on('initialize', (event, settings) => {
	drop0.children[0].firstChild.data = settings.drop0text
	drop0.src = settings.drop0sound
	drop0.style.backgroundImage = `url('${addSlashes(settings.drop0image)}')`

	drop1.children[0].firstChild.data = settings.drop1text
	drop1.src = settings.drop1sound
	drop1.style.backgroundImage = `url('${addSlashes(settings.drop1image)}')`

	drop2.children[0].firstChild.data = settings.drop2text
	drop2.src = settings.drop2sound
	drop2.style.backgroundImage = `url('${addSlashes(settings.drop2image)}')`

	drop3.children[0].firstChild.data = settings.drop3text
	drop3.src = settings.drop3sound
	drop3.style.backgroundImage = `url('${addSlashes(settings.drop3image)}')`

	drop4.children[0].firstChild.data = settings.drop4text
	drop4.src = settings.drop4sound
	drop4.style.backgroundImage = `url('${addSlashes(settings.drop4image)}')`

	drop5.children[0].firstChild.data = settings.drop5text
	drop5.src = settings.drop5sound
	drop5.style.backgroundImage = `url('${addSlashes(settings.drop5image)}')`

	drop6.children[0].firstChild.data = settings.drop6text
	drop6.src = settings.drop6sound
	drop6.style.backgroundImage = `url('${addSlashes(settings.drop6image)}')`

	drop7.children[0].firstChild.data = settings.drop7text
	drop7.src = settings.drop7sound
	drop7.style.backgroundImage = `url('${addSlashes(settings.drop7image)}')`

	drop8.children[0].firstChild.data = settings.drop8text
	drop8.src = settings.drop8sound
	drop8.style.backgroundImage = `url('${addSlashes(settings.drop8image)}')`

	drop9.children[0].firstChild.data = settings.drop9text
	drop9.src = settings.drop9sound
	drop9.style.backgroundImage = `url('${addSlashes(settings.drop9image)}')`
})