function loop() {
	if (document.getElementById("loop").style.backgroundColor == 'green') {
		//do stuff
		document.getElementById("loop").style.backgroundColor = "red";
		return
	}
	//do stuff
	document.getElementById("loop").style.backgroundColor = "green";
}

function image() {
	if(document.getElementById("image").style.backgroundColor == "green") {
		//do stuff
		document.getElementById("image").style.backgroundColor = 'red'
		return
	}
	//do stuff
	document.getElementById("image").style.backgroundColor = 'green'
}