//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')

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



var { Server } = require('node-osc');

var oscServer = new Server(7701, '0.0.0.0');

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});


const { Client } = require('node-osc');

cat("a")


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
			if ( string[i].length > 0 ) console.log(string[i])
		}


	})

	tty_cat.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	})

	tty_cat.on('close', function (pid, code) {
			cleanPID(pid)
			console.log("closed")
		}.bind(null, tty_cat["pid"]))
		// console.log("kill ttys")
	return tty_cat;
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
