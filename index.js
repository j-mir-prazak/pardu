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
var running = false;

setInterval(function(){
ls("/dev/tty*")
console.log("------------------")
console.log("ttys:")
console.log(ttys)
console.log("presenter: " + presenter)
console.log("arduino: " + arduino)
console.log("enttek: " +enttek)
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
	var pd = spawner.spawn("bash", new Array("-c", "pd-l2ork -open pd/pardu_player.pd -send \"ard "+ arduino + "\" -verbose"), {detached: true})
	var decoder = new StringDecoder('utf-8')
	pids.push(pd["pid"])

	pd.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {


			}
	});
	//not final state!
	pd.stderr.on('data', (data) => {
		var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( ( ! qlc || qlc.exitCode !== null )  && string[i].match(/\/usr\/lib\/pd-l2ork\/bin\/pd-watchdog/)) {
					console.log("pd started")
					qlc = qlcplus()
			}

			}
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^pd: cannot access/)) console.log(search + " not found")
		// return fapde
	});

	pd.on('close', function (pid, code) {

		console.log("pd closed")
		cleanPID(pid)
	}.bind(null, pd["pid"]));
	return pd;
}

// qlc()

function qlcplus() {
	var qlc = spawner.spawn("bash", new Array("-c", "qlcplus -o ./scene.qxw -p"), {detached: true})
	var decoder = new StringDecoder('utf-8')
	pids.push(qlc["pid"])

	qlc.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 ) {
				if (string[i].match(/^copyright/i)) console.log("qlc started")
				}

			}
	});
	//not final state!
	qlc.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^qlc: cannot access/)) console.log(search + " not found")
		// return faqlce
	});

	qlc.on('close', function (pid, code) {

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

	if ( ent && ard && (! pd || pd.exitCode !== null || pd.signalCode !== null ) && ( ! qlc || qlc.exitCode !== null  || qlc.signalCode !== null  ) ) {
		pd = pdl2ork()
	}

	if ( pd && ( pd.exitCode !== null || pd.signalCode !== null ) ) {
		console.log("pd down")
		if ( qlc && qlc.exitCode === null && qlc.signalCode === null ) {
			console.log("killing qlc")
			process.kill(-qlc["pid"])
		}
	}
	if ( qlc && ( qlc.exitCode !== null || pd.signalCode !== null ) ) {

		console.log("qlc down")
		if ( pd && pd.exitCode === null && pd.signalCode === null ) {
			console.log("starting qlc")
			qlc = qlcplus();
		}
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
							spawner.spawnSync('bash', ['-c', './sendOverTCP.sh \"' + press["press"] + '\"'])
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
