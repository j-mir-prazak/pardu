//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-mplayer')


//clean up
process.on('SIGHUP',  function(){ console.log('\nCLOSING: [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('\nCLOSING: [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("KILLING: " + pids[i])
		process.kill(-pids[i], 0)
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
			// console.log("PID"+pid+" deleted")
		}
	}
}

var xinputs = {};
var presenter = 0;
var enttek = "loaded";
var arduino = "";

var ttys = {}
var qlc;
var pd;
var pd_running = false;
var qlc_running = false;
var running = false;

var player;
var current_file;
var qlctimeout;

setInterval(function(){
ls("/dev/tty*")
console.log("------------------")
console.log("ttys:")
console.log(ttys)
console.log("presenter: " + presenter)
console.log("arduino: " + arduino)
console.log("enttek: " +enttek)
if (player) console.log("player state: " + player["state"])
presenter_check()
devices_status()
}, 3000)
ls("/dev/tty*")
console.log("------------------")
console.log("ttys:")
console.log(ttys)
console.log("presenter: " + presenter)
console.log("arduino: " + arduino)
console.log("enttek: " +enttek)
presenter_check()
pids.push(spawner.spawn('bash', ['-c', './socatcleaner.sh']).pid)

function udev(tty) {
	var tty=tty || false
	var udev = spawner.spawn("bash", new Array("usb.sh", tty["tty"]), {detached: true})
	var decoder = new StringDecoder('utf-8')
	pids.push(udev["pid"])

	udev.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && string[i].match(/VENDOR_ID=/)) {
				var id = string[i].replace(/\r?\n/, "").replace(/.*ID=(.*)/, "$1")
				tty["vendor"] = id;
				handletty(tty)
			}
		}
	});
	//not final state!
	udev.stderr.on('data', (data) => {

	});

	udev.on('close', function (pid, code) {
		// console.log("udev done")
		cleanPID(pid)

	}.bind(null, udev["pid"]));
	return udev;


}

function handletty(tty) {
	var tty = tty || false

	if ( ttys[tty["tty"]] ) {
		//the tty has changed; restart apps
		if ( ttys[tty["tty"]]["vendor"] != tty["vendor"] ) {

		}
		else console.log(tty["tty"]+ ": no change on vendor")
	}
	else {
		ttys[tty["tty"]] = tty
		console.log(tty["tty"] + " added")

	}


}

function pdl2ork() {
	var pd = spawner.spawn("bash", new Array("-c", "pd-l2ork -verbose -noaudio -open pd/pardu_player.pd -send \"ard "+ arduino + "\""), {detached: true})
	var decoder = new StringDecoder('utf-8')
	pids.push(pd["pid"])

	pd.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			pd_running = true;

			}
	});
	//not final state!
	pd.stderr.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			pd_running = true;
			}
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^pd: cannot access/)) console.log(search + " not found")
		// return fapde
	});

	pd.on('close', function (pid, code) {
		pd_running="exit"
		console.log("pd closed")
		cleanPID(pid)
	}.bind(null, pd["pid"]));
	return pd;
}

// qlc()

function qlcplus() {
	var qlc = spawner.spawn("bash", new Array("-c", "qlcplus -o ./scene.qxw -p -n"), {detached: true})
	var decoder = new StringDecoder('utf-8')
	pids.push(qlc["pid"])

	qlc.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			qlc_running = true;
			if ( string[i].length > 0 ) {
				if (string[i].match(/^copyright/i)) console.log("qlc started")
				}

			}
	});
	//not final state!
	qlc.stderr.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 ) {
				qlc_running = true;
				if (string[i].match(/^copyright/i)) console.log("qlc started")
				}
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^qlc: cannot access/)) console.log(search + " not found")
		// return faqlce
	}
});

	qlc.on('close', function (pid, code) {
		qlc_running=false
		console.log("qlc closed")
		cleanPID(pid)
	}.bind(null, qlc["pid"]));
	return qlc;
}

function devices_status() {

	var ent = ""
	var ard = ""


	for (var i in ttys) {
		if ( ttys[i]["vendor"] == "0403" ) ent = ttys[i]["tty"]
		if ( ttys[i]["vendor"] == "2341" ) ard = ttys[i]["tty"]
		if ( ttys[i]["vendor"] == "1a86" ) ard = ttys[i]["tty"]
	}
	if ( enttek && enttek != ent ) {
		ent = "loaded"
		console.log("change")
	}
	if ( arduino && arduino != arduino ) {
		console.log("change")
	}

	enttek = ent;
	if ( ttys[ent] ) ttys[ent]["device"] = "enttek"
	arduino = ard;
	if ( ttys[ard] ) ttys[ard]["device"] = "arduino"

	if ( ent ) console.log( "enttek is " + enttek )
	if ( ard ) console.log( "arduino is " + arduino )

	console.log( "pd down: " + ( ! pd || pd.exitCode !== null || pd.signalCode !== null ) )
	console.log( "qlc down: " + ( ! qlc || qlc.exitCode !== null  || qlc.signalCode !== null ) )

	console.log("ent + ard: " + ( enttek && arduino ))
	console.log("pd running: " + pd_running )
	console.log("qlc running: " + qlc_running )

	if ( enttek && arduino && pd_running == false && qlc_running == false ) {
		pd_running = true
		pd = pdl2ork()
	}

	if ( pd_running == "exit" ) {
		console.log("pd down")
		if ( qlc_running ) {
			if (qlc && qlc["pid"]) {
				console.log("killing qlc")
				process.kill(-qlc["pid"])
			}
		}
		pids.push(spawner.spawn('bash', ['-c', './cleanup.sh']).pid)
		pd_running = false
		qlc_running = false
	}
	if ( pd_running == true && qlc_running == false ) {
		console.log("qlc down")
		console.log("starting qlc")
		qlc_running = true
		if (qlctimeout) clearTimeout(qlctimeout)
		qlctimeout = setTimeout(function(){qlc = qlcplus()},15000)
	}
}









function ls(search) {
	var search=search || false
	var ls = spawner.spawn("bash", new Array("-c", "ls " + search), {detached: true})
	var decoder = new StringDecoder('utf-8')
	var check_ttys = new Array();

	pids.push(ls["pid"])

	ls.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 ) {
				var tty = {
					"tty":string[i],
					"vendor":"",
					"device":""
				}
				udev(tty)
				check_ttys.push(string[i])
			}
		}
	});
	//not final state!
	ls.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^ls: cannot access/)) console.log(search + " not found")
		// return false
	});

	ls.on('close', function (pid, code) {
		for( var j in ttys ) {
			var match = 0;
			check_ttys.forEach(function(v,i){
				if ( v == ttys[j]["tty"] ) match++
			})
			if ( match != 1 ) {
				console.log("delete: " + ttys[j]["tty"])
				if ( ttys[j]["device"] == "enttek" ) enttek = "loaded"
				if ( ttys[j]["device"] == "arduino" ) arduino = ""
				delete ttys[j]
			}
		}
		console.log("ls done")
		cleanPID(pid)
	}.bind(null, ls["pid"]));
	return ls;
}




function presenter_check() {

	var data = spawner.spawn('bash', new Array('./xinputs.sh',  'list'), {detached: true});
	var pid = data.pid
	var decoder = new StringDecoder('utf-8')
	var buffer = new Array();
	data.stdout.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
				if ( string[i].length > 0 ) {
					// console.log(string[i])
					buffer.push(string[i])
				}
			}
	})
	data.on("close", function (pid, code) {

		buffer.forEach(function(v, i){
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


			cleanPID(pid)
			console.log("closed")
		}.bind(null, data.pid))




	// var highest = 0;
	// for( i in xinputs ) {
	// 	var x = parseInt(i)
	// 	xinputs[i]['sending'] = false
	// 	if ( highest < x) highest = x
	// 	}
	// xinputs[highest]['sending'] = true
	// console.log("sending:"+highest)

}

//

// setInterval(function() {
//
// 	presenter_check();
//
// }, 3000)
//
//
// presenter_check()

function cat(id) {
	var tty = id || false
	if ( ! tty ) return false
	var presses = new Array()
	var time;
	var presser;

	var decoder = new StringDecoder('utf8')
	var tty_cat = spawner.spawn("bash", new Array("./xinputs.sh", "test", id), {detached: true})
	pids.push(tty_cat["pid"])


	tty_cat.stdout.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		if (presenter == 0 ) {

			presenter = xinputs[tty]["id"]
		}

		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && string[i].match(/key /) && presenter == xinputs[tty]["id"] ) {
				time = Date.now()
				var line = string[i].replace(/\r/, "")
			  line = line.replace(/\n/, "")
			  line = line.replace(/\s+/g, " ")
				var split = line.split(" ")
				var state = split[1];
				var key = split[2];
				// console.log(xinputs[id]["id"] + " : " + xinputs[id]["name"] + " : " + line)
				var press = {
					"press":key+"-"+state,
					"key":key,
					"state":state,
					"time":time
				}
				// console.log(press)
				presses.unshift(press)
				// console.log(press)

				if ( ! presser ) {
					presser = setInterval(function(presses){
						var press = presenter_click(presses)
						if ( press ) {
							presses.length=0
						// presses.splice(0, presses.length)
							console.log(press["press"])
							pids.push(spawner.spawn('bash', ['-c', './sendOverTCP.sh \"' + press["press"] + '\"']).pid)
						}
					}.bind(null, presses), 500)
				}
			}
			else if ( string[i].length > 0 && string[i].match(/key /) && presenter != xinputs[tty]["id"] && presser ) clearInterval(presser)
		}

	})

	tty_cat.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	})

	tty_cat.on('close', function (pid, code) {
			cleanPID(pid)
			presenter = 0;
			clearInterval(presser)
			console.log("presenter was disconnected")
		}.bind(null, tty_cat["pid"]))
		// console.log("kill ttys")
	return tty_cat;
}

function presenter_click(array){
	var encoder = array || false;

	//triple send
	if ( encoder.length == 3 ) {
			if ( encoder[0]["time"] == encoder[1]["time"] ) encoder.shift()
			else if ( encoder[1]["time"] == encoder[2]["time"] ) encoder.pop()
		}

	if (encoder.length >= 4) {
		if( ( encoder[0]["press"] == encoder[2]["press"] ) && ( encoder[0]["time"] -encoder[2]["time"]  < 500 )  ) {
			var press = {
				"key":encoder[0]["key"],
				"press":encoder[0]["key"]+" double",
				"state":"double"
			}
			return press

			}
		}
	else if ( encoder.length > 1 && encoder[0]["key"] == encoder[1]["key"] ) {
		var press = {
			"key":encoder[0]["key"],
			"press":encoder[0]["key"]+" press",
			"state":"press"
		}
		return press
	}

	return false
}


socat("a")

function socat(id) {
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
			pids.push(spawner.spawn('bash', ['-c', './socatcleaner.sh']).pid)
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
		"player": omx("pd/" + argument, 95),
		"volume": 95,
		"state":0
		}
		var pid = player["player"].pid
		pids.push(pid)
		player["player"].pause()
		player["state"] = 0

	}


	if ( player["player"].process ) {

		player["player"].process.stdout.on('data', (data) => {
			var decoder = new StringDecoder('utf-8')
			var string = decoder.write(data)
			string=string.split(/\r?\n/)

			for( var i = 0; i < string.length; i++) {

				 if (string[i].length > 0 && string[i].match(/Starting playback/) )
				{
					// spawner.spawnSync('bash', ['-c', './sendOverTCP.sh \"114 press\"'])
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
