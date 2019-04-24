//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var omx = require('node-mplayer')

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




cat("a")

var player;
var current_file;
function cat(id) {
	var tty = id || false
	if ( ! tty ) return false

	var decoder = new StringDecoder('utf8')
	var tty_cat = spawner.spawn('bash', ['-c', './listenOverTCP.sh'], {detached: true})
	pids.push(tty_cat["pid"])


	tty_cat.stdout.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && string[i].match(/.*\-.*/) ) {
				var split = string[i].split("-");
				console.log(split)
				var command = split[0]
				var argument = split[1].replace(/;.*/, "")
				if (command == "open") player = setupPlayer(argument)
				if (command == "pause" && player && player["player"].open ) {
					if (argument == 1 && player["state"] == 0) {
						player["state"] = 1
						player["player"].pause()
					}
					else if (argument == 0 && player["state"] == 1)	{
						player["state"] = 0
						player["player"].pause()
					}
				}
				if (command == "skipping" && player && player["player"].open ) {
				player["player"].quit()
				player["state"] = 0
				player = setupPlayer(current_file)
			}
		}
	}
})

	tty_cat.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	})

	tty_cat.on('close', function (pid, code) {
			spawner.spawnSync('bash', ['-c', './socatcleaner.sh'])
			cleanPID(pid)
			console.log("closed")
		}.bind(null, tty_cat["pid"]))
		// console.log("kill ttys")
	return tty_cat;
}


function setupPlayer(argument) {

	var argument = argument || false
	var player;

	var exists = fs.existsSync("pd/" + argument);
	if ( ! exists ) {
		console.log(argument + " doesn't exist");
		return false
	}
	else {
		console.log(argument + " exists")
		current_file = argument
		var player = {
		"player": omx("pd/" + argument, 35),
		"volume": 35,
		"state":0
		}
		var pid = player["player"].pid
		pids.push(pid)

	}


	if ( player["player"].process ) {

		player["player"].process.stdout.on('data', (data) => {
			var decoder = new StringDecoder('utf-8')
			var string = decoder.write(data)
			string=string.split(/\r?\n/)
			for( var i = 0; i < string.length; i++) {

				if (string[i].length > 0 && string[i].match(/Volume:/) )
				{

					var vol = escape(string[i])
					vol = vol.replace(/^.*5B(K*)(Volume)/, "$2")
					vol = unescape(vol)
					vol = vol.replace(/\r?\n/g,"")
					vol = vol.replace(/Volume: (.*?) *%/i,"$1")
					player["player"]["volume"] = vol
					tty["volume"] = vol
					console.log("Current volume: " + player["player"]["volume"] + "%")

				}

				else if (string[i].length > 0 && string[i].match(/Starting playback/) )
				{
					player["player"].pause()
					player["state"] = 0
					// spawner.spawnSync('bash', ['-c', './sendOverTCP.sh \"114 press\"'])
					console.log("player started playing")
				}

				else if (string[i].length > 0 && string[i].match(/.*5B(K*)/))console.log(string[i])
				// else console.log(string[i])
			}
		});

		player["player"].process.stderr.on('data', (data) => {
			// var decoder = new StringDecoder('utf-8')
			// var string = decoder.write(data)
			// string=string.split(/\r?\n/)
			// for( var i = 0; i < string.length; i++) {
			//  if (string[i].length > 0 )	console.log(string[i])
			// }
		});

	}

	player["player"].on('close', function(pid) {
		// spawner.spawnSync('bash', ['-c', './sendOverTCP.sh \"113 double\"'])
		console.log("playback ended")
		cleanPID(pid)
	}.bind(null, pid))

return player

}



// setInterval(function(){
// 	const client = new Client('127.0.0.1', 7700);
// 	var value = Math.floor(Math.random() * 255);
// 	console.log(value)
// 	client.send('/1/qlc/s2', value, () => {
//   client.close();
// });
// }, 100)
//
// setInterval(function(){
// 	const client = new Client('127.0.0.1', 7700);
// 	var value = Math.floor(Math.random() * 255);
// 	console.log(value)
// 	client.send('/1/qlc/s1', value, () => {
//   client.close();
// });
// }, 100)

// setInterval(function(){
// 	const client = new Client('127.0.0.1', 7700);
// 	var value = Math.floor(Math.random() * 255);
// 	console.log(value)
// 	client.send('/1/qlc/s3', value, () => {
//   client.close();
// });
// }, 100)
//
//
// setInterval(function(){
// 	const client = new Client('127.0.0.1', 7700);
// 	var value = Math.floor(Math.random() * 255);
// 	console.log(value)
// 	client.send('/1/qlc/s4', value, () => {
//   client.close();
// });
// }, 100)
