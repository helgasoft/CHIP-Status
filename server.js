/**
 * Autor: Mario Pérez Esteso <mario@geekytheory.com>
 * Web: geekytheory.com
 * Adapted for CHIP by Helgasoft   Jan 2016
 */
var port = 8000;
var
  app = require('http').createServer(handler).listen(port, "0.0.0.0"),
  path = require('path'),
  io = require('socket.io').listen(app),  //, { log: false }),
  fs = require('fs'),
  sys = require('util'),
  exec = require('child_process').exec,
  child, child1;
  //io.set('log level', 1);	//reduce log output, replaced with DEBUG=
var connectCounter = 0;

//function handler(req, res) {
//	fs.readFile(__dirname+'/index.html', function(err, data) {
//		if (err) {
// 			console.log(err);
//			res.writeHead(500);
//			return res.end('Error loading index.html');
//		}
//		res.writeHead(200);
//		res.end(data);
//	});
//}
//a helper function to handle HTTP requests
function handler(req, res) {
	var
	fileName = path.basename(req.url) || 'index.html',
	ext = path.extname(fileName),
	localFolder = __dirname + '/',
	//localFolder = __dirname + '/public/',
	page404 = localFolder + '404.html';

	//do we support the requested file type?
	if(!extensions[ext]){
		//for now just send a 404 and a short message
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.end("<html><head></head><body>The requested file type is not supported</body></html>");
	};

	//call our helper function
	//pass in the path to the file we want,
	//the response object, and the 404 page path
	//in case the requestd file is not found
	getFile((localFolder + fileName), res, page404, extensions[ext]);
};
//these are the only file types we will support
extensions = {
	".html": "text/html",
	".css" : "text/css",
	".js"  : "application/javascript",
	".png" : "image/png",
	".gif" : "image/gif",
	".jpg" : "image/jpeg",
	".ico" : "image/x-icon"
};

//helper function handles file verification
function getFile(filePath, res, page404, mimeType){
	//does the requested file exist?
	fs.exists(filePath, function(exists){
		if(exists){
			//read the fiule, run the anonymous function
			fs.readFile(filePath, function(err,contents){
				if(!err){
					//send the contents with the default 200/ok header
					res.writeHead(200,{
						"Content-type" : mimeType,
						"Content-Length" : contents.length
					});
					res.end(contents);
				} else
					console.dir(err);  //for our own troubleshooting
			});
		} else {
			//if the requested file was not found serve-up our custom 404 page
			fs.readFile(page404, function(err,contents){
				if(!err){
					//send the contents with a 404/not found header
					res.writeHead(404, {'Content-Type': 'text/html'});
					res.end(contents);
				} else
					console.dir(err);  //for our own troubleshooting
			});
		};
	});
};

// listen for an HTTP request on port 3000
app.listen(port);

//Cuando abramos el navegador estableceremos una conexión con socket.io.
//Cada X segundos mandaremos a la gráfica un nuevo valor.
io.sockets.on('connection', function(socket) {
  var memTotal = 0, memUsed = 0, memFree = 0, memBuffered = 0, memCached = 0, sendData = 1, percentBuffered, percentCached, percentUsed, percentFree;
  var address = socket.handshake.address;

  console.log("New connection from " + address.address + ":" + address.port);
  connectCounter++;
  console.log("NUMBER OF CONNECTIONS++: "+connectCounter);
  socket.on('disconnect', function() { connectCounter--;  console.log("NUMBER OF CONNECTIONS--: "+connectCounter);});


  // Function for measuring ACIN voltage in Volts
  var getACINvoltage = function(){
    child = exec("lsb=$(i2cget -y -f 0 0x34 0x57); msb=$(i2cget -y -f 0 0x34 0x56); bin=$(( $(($msb << 4)) | $(($lsb & 0x0F)))); echo $bin", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('ACINvoltageUpdate exec error: ' + error);
    } else {
      //Es necesario mandar el tiempo (eje X) y un valor de voltage (eje Y).
      var time = new Date().getTime();
      var current = parseFloat(stdout)*1.7;	  // in volts
      socket.emit('ACINvoltageUpdate', time, current);
    }
  });}

  // Function for measuring ACIN current in mA
  var getACINcurrent = function(){
    child = exec("lsb=$(i2cget -y -f 0 0x34 0x59); msb=$(i2cget -y -f 0 0x34 0x58); bin=$(( $(($msb << 4)) | $(($lsb & 0x0F)))); echo $bin", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('ACINcurrentUpdate exec error: ' + error);
    } else {
      //Es necesario mandar el tiempo (eje X) y un valor de current (eje Y).
      var time = new Date().getTime();
      var current = parseFloat(stdout)*0.375;	  // in milliAmps
      socket.emit('ACINcurrentUpdate', time, current);
    }
  });}

  // Function for checking memory
  child = exec("egrep 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('memoryTotal exec error: ' + error);
    } else {
      memTotal = parseInt(stdout);
      socket.emit('memoryTotal', memTotal);
    }
  });

  child = exec("hostname", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('hostname exec error: ' + error);
    } else {
      socket.emit('hostname', stdout);
    }
  });

  child = exec("uname -r", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('kernel exec error: ' + error);
    } else {
      socket.emit('kernel', stdout);
    }
  });

  setInterval(function(){
    // Function for checking memory free and used  "cat /proc/meminfo"
    child1 = exec("egrep 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
      if (error == null) {
        memFree = parseInt(stdout);
        memUsed = memTotal-memFree;
        percentUsed = Math.round(memUsed*100/ memTotal);
        percentFree = 100 - percentUsed;
      } else {
        sendData = 0;
        console.log('MemFree exec error: ' + error);
      }
    });

    // Function for checking memory buffered
    child1 = exec("egrep 'Buffers' /proc/meminfo | egrep '[0-9.]{1,}' -o", function (error, stdout, stderr) {
      if (error == null) {
        memBuffered = parseInt(stdout);
        //if (isNaN(memBuffered)) memBuffered=0
        percentBuffered = Math.round(memBuffered * 100 / memTotal);
      } else {
        sendData = 0;
        console.log('Buffers exec error: ' + error);
      }
    });

    // Function for checking memory buffered
    child1 = exec("egrep 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
      if (error == null) {
        memCached = parseInt(stdout);
        percentCached = Math.round(memCached*100/ memTotal);
      } else {
        sendData = 0;
        console.log('Cached exec error: ' + error);
      }
    });

    if (sendData == 1) {
      socket.emit('memoryUpdate', percentFree, percentUsed, percentBuffered, percentCached);
    } else {
      sendData = 1;
    }
  }, 5000);

  // Emit ACIN voltage and current if ACIN exists
  setInterval(function(){
    child = exec("echo $(($(i2cget -y -f 0 0x34 0x00) & 0x80 ))", function (error, stdout, stderr) {
      if (error !== null) {
        console.log('"echo $(($(i2cget -y -f 0 0x34 0x00) & 0x80 ))" exec error: ' + error);
      } else {
        if (stdout.trim() != "0") {
          getACINvoltage();
          getACINcurrent();
          console.log( 'ACIN stdout = ' + stdout );
        } else
          console.log( 'ACIN voltage not present' );
      }
    });
  }, 5000);

  // Function for measuring VBUS voltage in Volts
  setInterval(function(){
    child = exec("lsb=$(i2cget -y -f 0 0x34 0x5b); msb=$(i2cget -y -f 0 0x34 0x5a); bin=$(( $(($msb << 4)) | $(($lsb & 0x0F)))); echo $bin", function (error, stdout, stderr) {
      if (error !== null) {
        console.log('VBUSvoltageUpdate exec error: ' + error);
      } else {
        //Es necesario mandar el tiempo (eje X) y un valor de voltage (eje Y).
        var time = new Date().getTime();
        var current = parseFloat(stdout)*1.7;	  // in volts
        socket.emit('VBUSvoltageUpdate', time, current);
      }
    });
  }, 5000);

  // Function for measuring VBUS current in mA
  setInterval(function(){
    child = exec("lsb=$(i2cget -y -f 0 0x34 0x5d); msb=$(i2cget -y -f 0 0x34 0x5c); bin=$(( $(($msb << 4)) | $(($lsb & 0x0F)))); echo $bin", function (error, stdout, stderr) {
      if (error !== null) {
        console.log('VBUScurrentUpdate exec error: ' + error);
      } else {
        //Es necesario mandar el tiempo (eje X) y un valor de current (eje Y).
        var time = new Date().getTime();
        var current = parseFloat(stdout)*0.375;	  // in milliAmps
        socket.emit('VBUScurrentUpdate', time, current);
      }
    });
  }, 5000);

  // Function for measuring temperature
  setInterval(function(){
    child = exec("lsb=$(i2cget -y -f 0 0x34 0x5f); msb=$(i2cget -y -f 0 0x34 0x5e); bin=$(( $(($msb << 4)) | $(($lsb & 0x0F)))); echo $bin", function (error, stdout, stderr) {
      if (error !== null) {
        console.log('temperatureUpdate exec error: ' + error);
      } else {
        //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
        var time = new Date().getTime();
        var temp = parseFloat(stdout)/10 - 144.7;	  // in Celsius
        socket.emit('temperatureUpdate', time, temp);
      }
    });
  }, 5000);

  setInterval(function(){
    child = exec("top -d 0.5 -b -n2 | grep 'Cpu(s)' | tail -n 1 | awk '{print $2 + $4}'", function (error, stdout, stderr) {
      if (error !== null) {
        console.log('cpuUsageUpdate exec error: ' + error);
      } else {
        //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
        var time = new Date().getTime();
        socket.emit('cpuUsageUpdate', time, parseFloat(stdout));
      }
    });
  }, 10000);

	// Uptime
  setInterval(function(){
    child = exec("uptime", function (error, stdout, stderr) {  // | awk '{print $3}' |  rev | cut -c 2- | rev
	    if (error !== null) {
	      console.log('uptime exec error: ' + error);
	    } else {
	      // uptime returns a string "10:42:27 up 1 day,  2:10,  3 users,  load average: 2.12, 1.44, 1.38"
	      var juptime = stdout.substring(stdout.lastIndexOf("up")+3, stdout.lastIndexOf("users"));
	      juptime = juptime.substr(0, juptime.length-5);
	      socket.emit('uptime', juptime);
	    }
	  });
  }, 60000);

// TOP list
  setInterval(function(){
    child = exec("ps -Ao comm,pcpu --sort=-pcpu --no-headers | head -n 10 | awk '{print $1 \" - \" $2\"%\"}'", function (error, stdout, stderr) {	//ps aux --width 30'
	    if (error !== null) {
	      console.log('toplist exec error: ' + error);
	    } else {
	      socket.emit('toplist', stdout);
	    }
	  });
  }, 10000);
});
