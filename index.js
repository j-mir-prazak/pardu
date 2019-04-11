//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-omxplayer')


//clean up
process.on('SIGHUP',  function(){ console.log('\nCLOSING: [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('\nCLOSING: [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("KILLING: " + pids[i])
		process.kill(-pids[i])
 	}
	 process.exit(0);
 })
process.on('SIGQUIT', function(){ console.log('\nCLOSING: [SIGQUIT]'); process.emit("SIGINT"); })
process.on('SIGABRT', function(){ console.log('\nCLOSING: [SIGABRT]'); process.emit("SIGINT"); })
process.on('SIGTERM', function(){ console.log('\nCLOSING: [SIGTERM]'); process.emit("SIGINT"); })

var pids = new Array();

function cleanPID(pid) {
	var pid = pid || false
	for (var i = 0; i < pids.length; i++) {
		if ( pids[i] == pid ) {
			pids.splice(i, 1)
			console.log("PID"+pid+" deleted")
		}
	}
}

var xinputs = {};

function presenter_check() {

	var data = spawner.spawnSync('bash', ['-c', './xinputs.sh list']).stdout;
	var decoder = new StringDecoder('utf-8')
	var string = decoder.write(data)
	var lines = string.split(/\r?\n/);
	lines.forEach(function(v, i){
		if (v.match(/Logitech USB Receiver\s?.*id/) ) {
			var id = v.replace(/^.*id=(\d+).*$/, "$1")
			// console.log(id)
			var name = v.replace(/^.*(Logitech USB Receiver.*?)(\t*|\s?)id=.*/g,"$1" )
			// console.log(name)
			if ( ! xinputs[id] ) {
				console.log("pointer added:" + id)
				xinputs[id] = { 'id':id, 'cat':cat(id), 'name':name, 'sending':false }
				}
			}
		})

	var highest = 0;
	for( i in xinputs ) {
		var x = parseInt(i)
		xinputs[i]['sending'] = false
		if ( highest < x) highest = x
		}
	xinputs[highest]['sending'] = true
	console.log("sending:"+highest)

}

//

setInterval(function() {

	presenter_check();

}, 3000)


presenter_check()

function cat(id) {
	var tty = id || false
	if ( ! tty ) return false

	var decoder = new StringDecoder('utf8')
	var tty_cat = spawner.spawn("bash", new Array("./xinputs.sh", "test", id), {detached: true})
	pids.push(tty_cat["pid"])


	tty_cat.stdout.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && string[i].match(/key /) && xinputs[tty]["sending"]) {
				var line = string[i].replace(/\r/, "")
			  line = line.replace(/\n/, "")
			  line = line.replace(/\s+/g, " ")
				console.log(xinputs[id]["id"] + " : " + xinputs[id]["name"] + " : " + line)
				spawner.spawnSync('bash', ['-c', './sendOverTCP.sh \"' + line + '\"'])

			}
		}


	})

	tty_cat.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	})

	tty_cat.on('close', function (pid, code) {
			cleanPID(pid)
			console.log(tty["tty"] + " was disconnected. killing dimmer on this node.")
		}.bind(null, tty_cat["pid"]))
		// console.log("kill ttys")
	return tty_cat;
}

// function setupHandler(asset) {
// 	lock = true
// 	if ( connection_check() == 1 ) {
// 		console.log("no internet connection. waiting.")
// 		setTimeout(function(asset) {
// 			setupHandler(asset)
// 		}.bind(null,asset), 500)
// 	}
// 	else {
// 		console.log("internet connection. playing.")
// 		setupPlayer(asset)
// 	}
// }
