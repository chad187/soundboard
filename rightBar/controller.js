// Use the electronAPI bridge from preload

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
let playingAudio = [];

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

drop0.addEventListener('drop', dropHandler)
drop1.addEventListener('drop', dropHandler)
drop2.addEventListener('drop', dropHandler)
drop3.addEventListener('drop', dropHandler)
drop4.addEventListener('drop', dropHandler)
drop5.addEventListener('drop', dropHandler)
drop6.addEventListener('drop', dropHandler)
drop7.addEventListener('drop', dropHandler)
drop8.addEventListener('drop', dropHandler)
drop9.addEventListener('drop', dropHandler)

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

function dropHandler(e) {
	e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files; // Array of all files
  let images = ['gif', 'jpg', 'jpeg', 'png', 'bmp']
  let sounds = ['mp3', 'wma', 'wav']

  for (var i=0, file; file=files[i]; i++) {
  	let extension = file.path.split('.').pop().toLowerCase() // Get last extension
  	if (images.indexOf(extension) !== -1) {
  		let imagePath = file.path.replace(/\\/g, "\\\\")
  		if(e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.style.backgroundImage = `url('${imagePath}')`
  			window.electronAPI.send('change-image', file.path, "right", e.srcElement.parentNode.id)
  		}
  		else {
  			e.srcElement.style.backgroundImage = `url('${imagePath}')`
  			window.electronAPI.send('change-image', file.path, "right", e.srcElement.id)
  		}
  	}
  	else if (sounds.indexOf(extension) !== -1) {
  		if (e.srcElement.nodeName == 'SPAN') {
  			e.srcElement.parentNode.src = file.path
  			window.electronAPI.send('show-prompt', file.path, "right", e.srcElement.parentNode.id)
  		}
  		else{
  			e.srcElement.src = file.path
  			window.electronAPI.send('show-prompt', file.path, "right", e.srcElement.id)
  		}
  	}
  	else {
  		alert("Unknown file type")
  	}
   }
}

// Expose playMedia to global scope for onclick handlers
window.playMedia = function(drop) {
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
		 			saveFile(audioBlob).then(fileName => {
		 				pressed.src = fileName
		 				window.electronAPI.send('show-prompt', fileName, "right", drop)
		 			})
		    })
		  })
  }
  else if (isKeyMap) {
  	clearChosen()
  	pressed.style.opacity = .1
  	toMap = pressed
  	window.electronAPI.send('isSelected', 'right')
  }
	else {
		window.electronAPI.send('show-image', pressed.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''), "right", drop)
	  if (pressed.src && pressed.src !== window.location.href) {
		  let audio = new Audio(pressed.src)
		  playingAudio.push(audio)
		  audio.onended = () => {
			  let idx = playingAudio.indexOf(audio)
			  if (idx > -1) playingAudio.splice(idx, 1)
		  }
		  audio.play().catch(err => console.log('Audio play error:', err))
	  }
	}
}

function completedAudio(audioSource) {
	// No longer used - cleanup handled inline
}

function killAllAudio() {
	playingAudio.forEach((value, index, array) => {
		value.pause()
		value.currentTime = 0
	})
	playingAudio = null
	playingAudio = []
}

async function saveFile(file) {
	return new Promise((resolve) => {
		let fileReader = new FileReader();
		fileReader.onload = function() {
		  const fileName = window.electronAPI.saveAudioFile(this.result)
		  resolve(fileName)
		}
		fileReader.readAsArrayBuffer(file);
	})
}

// Expose stopSample to global scope for onmouseup handlers
window.stopSample = function(drop) {
	if (isSample) {
		let pressed = document.getElementById(drop)
		pressed.style.opacity = 1
		window.electronAPI.send('force-red')
		window.electronAPI.send('toggle-sample', false)
		mediaRecorder.stop()
		mediaRecorder = null
	}
}

function addSlashes(file) {
	if (file) return file.replace(/\\/g, "\\\\")
	else return
}

window.electronAPI.on('toggle-sample', (isOn) => {
	isSample = isOn
})

window.electronAPI.on('stop-all-audio', () => {
	killAllAudio()
})

window.electronAPI.on('toggle-keyMap', (isOn) => {
	if (!isOn) {
		clearChosen()
	}
	isKeyMap = isOn
})

window.electronAPI.on('return-prompt', (name, id) => {
	const element = document.getElementById(id)
	if (element && element.children[0] && element.children[0].firstChild) {
		element.children[0].firstChild.data = name
	}
})

function checkMapAdd (keycode) {
	if (keycode == 27 || keycode == 53) alert("esc is for stopping audio")
	else {
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
}

function checkMapPlay(keycode) {
	if (keycode == 27 || keycode == 53) killAllAudio()
	else {
		for (var [id, code] of keyMap) {
			if (code == keycode) {
		  	window.playMedia(id)
		  	break
		  }
		}
	}
}

function keyCodeToLetter(keycode) {
	return window.keyCodeUtils.keyCodeToLetter(keycode)
}

window.electronAPI.on('keyDown', (keycode) => {
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
		window.electronAPI.send('save-keyMap', "right", JSON.stringify([...keyMap]))
		isSelected = false
		window.electronAPI.send('toggle-keyMap', false)
		window.electronAPI.send('force-red')
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

window.electronAPI.on('selected-off', (switchOff) => {
	if (switchOff) clearChosen()
	else isSelected = true
})

window.electronAPI.on('update-keymap', (tempKeyMap) => {
	for (var [id, code] of keyMap) {
		for(var [tempID, tempCode] of tempKeyMap) {
			if (code == tempCode) {
	    	let oldButton = document.getElementById(id)
	    	let oldSpan =oldButton.children[1].firstChild
	    	oldSpan.data = null
	    	keyMap.delete(id)
	    	window.electronAPI.send('clean-keyMap', "right", JSON.stringify([...keyMap]))
	    	break
	    }
		}
	}
})

window.electronAPI.on('initialize', (settings) => {
	buildMap(settings.keymap)
	drop0.children[0].firstChild.data = settings.drop0text != undefined ? settings.drop0text : 'Empty'
	drop0.src = settings.drop0sound
	if (keyMap.has('drop0')) document.getElementById('drop0').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop0'))
	if(settings.drop0image) drop0.style.backgroundImage = `url('${addSlashes(settings.drop0image)}')`

	drop1.children[0].firstChild.data = settings.drop1text != undefined ? settings.drop1text : 'Empty'
	drop1.src = settings.drop1sound
	if (keyMap.has('drop1')) document.getElementById('drop1').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop1'))
	if(settings.drop1image) drop1.style.backgroundImage = `url('${addSlashes(settings.drop1image)}')`

	drop2.children[0].firstChild.data = settings.drop2text != undefined ? settings.drop2text : 'Empty'
	drop2.src = settings.drop2sound
	if (keyMap.has('drop2')) document.getElementById('drop2').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop2'))
	if(settings.drop2image) drop2.style.backgroundImage = `url('${addSlashes(settings.drop2image)}')`

	drop3.children[0].firstChild.data = settings.drop3text != undefined ? settings.drop3text : 'Empty'
	drop3.src = settings.drop3sound
	if (keyMap.has('drop3')) document.getElementById('drop3').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop3'))
	if(settings.drop3image) drop3.style.backgroundImage = `url('${addSlashes(settings.drop3image)}')`

	drop4.children[0].firstChild.data = settings.drop4text != undefined ? settings.drop4text : 'Empty'
	drop4.src = settings.drop4sound
	if (keyMap.has('drop4')) document.getElementById('drop4').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop4'))
	if(settings.drop4image) drop4.style.backgroundImage = `url('${addSlashes(settings.drop4image)}')`

	drop5.children[0].firstChild.data = settings.drop5text != undefined ? settings.drop5text : 'Empty'
	drop5.src = settings.drop5sound
	if (keyMap.has('drop5')) document.getElementById('drop5').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop5'))
	if(settings.drop5image) drop5.style.backgroundImage = `url('${addSlashes(settings.drop5image)}')`

	drop6.children[0].firstChild.data = settings.drop6text != undefined ? settings.drop6text : 'Empty'
	drop6.src = settings.drop6sound
	if (keyMap.has('drop6')) document.getElementById('drop6').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop6'))
	if(settings.drop6image) drop6.style.backgroundImage = `url('${addSlashes(settings.drop6image)}')`

	drop7.children[0].firstChild.data = settings.drop7text != undefined ? settings.drop7text : 'Empty'
	drop7.src = settings.drop7sound
	if (keyMap.has('drop7')) document.getElementById('drop7').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop7'))
	if(settings.drop7image) drop7.style.backgroundImage = `url('${addSlashes(settings.drop7image)}')`

	drop8.children[0].firstChild.data = settings.drop8text != undefined ? settings.drop8text : 'Empty'
	drop8.src = settings.drop8sound
	if (keyMap.has('drop8')) document.getElementById('drop8').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop8'))
	if(settings.drop8image) drop8.style.backgroundImage = `url('${addSlashes(settings.drop8image)}')`

	drop9.children[0].firstChild.data = settings.drop9text != undefined ? settings.drop9text : 'Empty'
	drop9.src = settings.drop9sound
	if (keyMap.has('drop9')) document.getElementById('drop9').children[1].firstChild.data = keyCodeToLetter(keyMap.get('drop9'))
	if(settings.drop9image) drop9.style.backgroundImage = `url('${addSlashes(settings.drop9image)}')`
})