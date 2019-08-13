const {ipcRenderer} = require('electron')
const fs = require('fs')
const {keyname} = require('os-keycode')

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

let isSample
let isKeyMap
let mediaRecorder
let isSelected
let keyMap = new Map()
let toMap

function dragover(e) {
	e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function drop(e) {
	e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // Array of all files
  let images = ['gif', 'jpg', 'jpeg', 'png', 'bmp']
  let sounds = ['mp3', 'wma', 'wav']

  for (var i=0, file; file=files[i]; i++) {
  	let extension = file.path.split('.')[1] //this is error prone way
  	if (images.indexOf(extension) !== -1) {
  		imagePath = file.path.replace(/\\/g, "\\\\")
  		if(e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.style.backgroundImage = `url('${imagePath}')`
  			ipcRenderer.send('change-image', file.path, "right", e.srcElement.parentNode.id)
  		}
  		else {
  			e.srcElement.style.backgroundImage = `url('${imagePath}')`
  			ipcRenderer.send('change-image', file.path, "right", e.srcElement.id)
  		}
  	}
  	else if (sounds.indexOf(extension) !== -1) {
  		if (e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.src = file.path
  			ipcRenderer.send('show-prompt', file.path, "right", e.srcElement.parentNode.id)
  		}
  		else{
  			e.srcElement.src = file.path
  			ipcRenderer.send('show-prompt', file.path, "right", e.srcElement.id)
  		}
  	}
  	else {
  		alert("Unknown file type")
  	}
   }
}

function playMedia(drop) {
	let pressed = document.getElementById(drop)
	if (isSample) {
		pressed.style.opacity = .1

		navigator.mediaDevices.getUserMedia({ audio: true })
		  .then(stream => {
		    mediaRecorder = new MediaRecorder(stream);
		    mediaRecorder.start();

		    const audioChunks = [];

		    mediaRecorder.addEventListener("dataavailable", event => {
		      audioChunks.push(event.data);
		    })

		    mediaRecorder.addEventListener("stop", (event) => {
		      const audioBlob = new Blob(audioChunks,{type:'audio/aac'});
		      const audioUrl = URL.createObjectURL(audioBlob);
		 			pressed.src = saveFile(audioBlob)
		 			ipcRenderer.send('show-prompt', pressed.src, "right", drop)
		      // const audio = new Audio(audioUrl);
      		// audio.play();
		      
		    })
		  })    
  }
  else if (isKeyMap) {
  	clearChosen()
  	pressed.style.opacity = .1
  	toMap = pressed
  	ipcRenderer.send('isSelected', 'right')
  }
	else {
		ipcRenderer.send('show-image', pressed.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''), "right", drop)
	  let audio = new Audio(pressed.src)
	  audio.play()
	}
}

function saveFile(file) {
	let fileReader = new FileReader();
	let fileName = require('path').join(require('os').homedir(), 'Desktop') + '\\' + Date.now() + '.aac'
	fileReader.onload = function() {
	  fs.writeFileSync(fileName, Buffer.from(new Uint8Array(this.result)));
	}
	fileReader.readAsArrayBuffer(file);
	return fileName
}

function stopSample(drop) {
	if (isSample) {
		let pressed = document.getElementById(drop)
		pressed.style.opacity = 1
		ipcRenderer.send('force-red')
		ipcRenderer.send('toggle-sample', false)
		mediaRecorder.stop()
		mediaRecorder = null
	}
}

function addSlashes(file) {
	if (file) return file.replace(/\\/g, "\\\\")
	else return
}

ipcRenderer.on('toggle-sample', (event, isOn) => {
	isSample = isOn
})

ipcRenderer.on('toggle-keyMap', (event, isOn) => {
	if (!isOn) {
		clearChosen()
	}
	isKeyMap = isOn
})

ipcRenderer.on('return-prompt', (event, name, id) => {
	eval(`${id}.children[0].firstChild.data = '${name}'`)
})

function checkMapAdd (keycode) {
	for (var [id, code] of keyMap) {
    if (code == keycode) {
    	let oldButton = document.getElementById(id)
    	let oldSpan =oldButton.children[1].firstChild
    	oldSpan.data = null
    	keyMap.delete(id)
    	break
    }
  }
  keyMap.set(toMap.id, keycode)
	let button = document.getElementById(toMap.id)
	let span = button.children[1].firstChild
	span.data = keyCodeToLetter(keycode)
}

function checkMapPlay(keycode) {
	for (var [id, code] of keyMap) {
		if (code == keycode) {
	  	playMedia(id)
	  	break
	  }
	}
}

function keyCodeToLetter(keycode) {
	return keyname(keycode).keys[0].toUpperCase()
}

ipcRenderer.on('keyDown', (event, keycode) => {
	if (isSelected && isKeyMap) {
		if (keyMap.size == 0) {
			keyMap.set(toMap.id, keycode)
	    let button = document.getElementById(toMap.id)
	    let span = button.children[1].firstChild
	    span.data = keyCodeToLetter(keycode)
		}
		else {
			checkMapAdd(keycode)
		}
		ipcRenderer.send('save-keyMap', "right", JSON.stringify([...keyMap]))
		isSelected = false
		ipcRenderer.send('toggle-keyMap', false)
		ipcRenderer.send('force-red')
		if (toMap != null ) document.getElementById(toMap.id).style.opacity = 1
		toMap = null
	}
	else if (!isSelected && !isKeyMap) {
		checkMapPlay(keycode)
	}
})

function buildMap(arrayMap) {
	if (arrayMap != null) {
		for (var i=0; i < arrayMap.length; i++){
			keyMap.set(arrayMap[i][0], arrayMap[i][1])
		}
	}
}

function clearChosen() {
	isSelected = false
	if (toMap != null ) document.getElementById(toMap.id).style.opacity = 1
	toMap = null
}

ipcRenderer.on('selected-off', (event, switchOff) => {
	if (switchOff) clearChosen()
	else isSelected = true
})

ipcRenderer.on('update-keymap', (event, tempKeyMap) => {
	for (var [id, code] of keyMap) {
		for(var [tempID, tempCode] of tempKeyMap) {
			if (code == tempCode) {
	    	let oldButton = document.getElementById(id)
	    	let oldSpan =oldButton.children[1].firstChild
	    	oldSpan.data = null
	    	keyMap.delete(id)
	    	ipcRenderer.send('clean-keyMap', "right", JSON.stringify([...keyMap]))
	    	break
	    }
		}
	}
})

ipcRenderer.on('initialize', (event, settings) => {
	buildMap(settings.keymap)
	drop0.children[0].firstChild.data = settings.drop0text != undefined ? settings.drop0text : ''
	drop0.src = settings.drop0sound
	if (keyMap.has('drop0')) document.getElementById('drop0').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop0'))
	if(settings.drop0image) drop0.style.backgroundImage = `url('${addSlashes(settings.drop0image)}')`

	drop1.children[0].firstChild.data = settings.drop1text != undefined ? settings.drop1text : ''
	drop1.src = settings.drop1sound
	if (keyMap.has('drop1')) document.getElementById('drop1').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop1'))
	if(settings.drop1image) drop1.style.backgroundImage = `url('${addSlashes(settings.drop1image)}')`

	drop2.children[0].firstChild.data = settings.drop2text != undefined ? settings.drop2text : ''
	drop2.src = settings.drop2sound
	if (keyMap.has('drop2')) document.getElementById('drop2').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop2'))
	if(settings.drop2image) drop2.style.backgroundImage = `url('${addSlashes(settings.drop2image)}')`

	drop3.children[0].firstChild.data = settings.drop3text != undefined ? settings.drop3text : ''
	drop3.src = settings.drop3sound
	if (keyMap.has('drop3')) document.getElementById('drop3').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop3'))
	if(settings.drop3image) drop3.style.backgroundImage = `url('${addSlashes(settings.drop3image)}')`

	drop4.children[0].firstChild.data = settings.drop4text != undefined ? settings.drop4text : ''
	drop4.src = settings.drop4sound
	if (keyMap.has('drop4')) document.getElementById('drop4').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop4'))
	if(settings.drop4image) drop4.style.backgroundImage = `url('${addSlashes(settings.drop4image)}')`

	drop5.children[0].firstChild.data = settings.drop5text != undefined ? settings.drop5text : ''
	drop5.src = settings.drop5sound
	if (keyMap.has('drop5')) document.getElementById('drop5').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop5'))
	if(settings.drop5image) drop5.style.backgroundImage = `url('${addSlashes(settings.drop5image)}')`

	drop6.children[0].firstChild.data = settings.drop6text != undefined ? settings.drop6text : ''
	drop6.src = settings.drop6sound
	if (keyMap.has('drop6')) document.getElementById('drop6').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop6'))
	if(settings.drop6image) drop6.style.backgroundImage = `url('${addSlashes(settings.drop6image)}')`

	drop7.children[0].firstChild.data = settings.drop7text != undefined ? settings.drop7text : ''
	drop7.src = settings.drop7sound
	if (keyMap.has('drop7')) document.getElementById('drop7').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop7'))
	if(settings.drop7image) drop7.style.backgroundImage = `url('${addSlashes(settings.drop7image)}')`

	drop8.children[0].firstChild.data = settings.drop8text != undefined ? settings.drop8text : ''
	drop8.src = settings.drop8sound
	if (keyMap.has('drop8')) document.getElementById('drop8').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop8'))
	if(settings.drop8image) drop8.style.backgroundImage = `url('${addSlashes(settings.drop8image)}')`

	drop9.children[0].firstChild.data = settings.drop9text != undefined ? settings.drop9text : ''
	drop9.src = settings.drop9sound
	if (keyMap.has('drop9')) document.getElementById('drop9').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop9'))
	if(settings.drop9image) drop9.style.backgroundImage = `url('${addSlashes(settings.drop9image)}')`
})