var httpPort = 8080, socketPort = 8081;

var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var io = require('socket.io')(socketPort);
var express = require('express');
var app = express();
var http = require('http').Server(app);

var async = {
  dataFromArdu: '', 
  angle: 0,
  arduReady: false,
  compassReady: false
};
var foundDevices = [], start, connection = false, blueFound = false;

app.use(express.static('static'));

http.listen(httpPort, function(){
  console.log('listening on http://0.0.0.0:'+httpPort);
});

function bluetoothConnect(address){
  btSerial.findSerialPortChannel(address, function(channel) {
		btSerial.connect(address, channel, function() {
      
      try {
        io.sockets.emit('blueConnect', {rsp: true}); // broadcast to all socket clients that it is connected to arduino
      } catch(err){
        console.log(err);
      }

      console.log('connected');
      connection = true;
      
      btSerial.on('data', function(buffer) {
        let data = buffer.toString('utf-8');
        if(data.indexOf('{') !== -1){
          async.dataFromArdu = data;
          async.arduReady = false;
        } else if(data.indexOf('}') !== -1){
          async.dataFromArdu += data;
          async.dataFromArdu = JSON.parse(async.dataFromArdu);
          async.arduReady = true;
        } else {
          async.dataFromArdu += data;
        }
				console.log(async.dataFromArdu);
			});
      
      /*
			btSerial.write(new Buffer('c', 'utf-8'), function(err, bytesWritten) {
				if (err) console.log(err);
			});
      */
			
		}, function () {
      console.log('cannot connect');
      io.sockets.emit('blueConnect', {rsp: false});
		});

		// close the connection when you're ready
		btSerial.close();
	}, function() {
		console.log('found nothing');
	});
}

setTimeout(() => {
  btSerial.inquire(); // start searching devices (first search)
  console.log("inquire");
}, 0);

setInterval(() => {
  console.log("inquire ", blueFound && !connection);
  if(blueFound && !connection){ // if something found and not connected, searches
    btSerial.inquire(); // start searching devices
    blueFound = false;
  }
}, 30000); // Bluetooth scan tooks up to 30s


btSerial.on('found', function(address, name) {

  if(!blueFound)  foundDevices = []; // clears found devices if this is the first found device

  console.log('Found ', name, ' at ', address);
  foundDevices.push({name: name, address: address});
  io.sockets.emit('newNearby', {name: name, address: address});

  blueFound = true;
  
});

btSerial.on('failure', (address, name) => { // tooks up to 30s to be detected
  console.log('Bluetooth failure');
  connection = false;
  io.sockets.emit('blueConnect', {rsp: false});
});

btSerial.on('close', (address, name) => {
  console.log('Bluetooth closed');
  connection = false;
  io.sockets.emit('blueConnect', {rsp: false});
});

io.on('connection', (socket) => {

  console.log('New connection');

  socket.on('getMessage', (data) => {
    socket.emit('readMessage', {
      msg: async.dataFromArdu
    });
  });

  socket.on('toggleArduinoRotation', (data) => { // toggle arduino rotation
    console.log('toggleArduino');
    btSerial.write(new Buffer('t', 'utf-8'), function(err, bytesWritten) {
      if (err) console.log(err);
    });
  });

  socket.on('stopArduinoRotation', (data) => {
    console.log('Stop Arduino');
    btSerial.write(new Buffer('s', 'utf-8'), function(err, bytesWritten) {
      if (err) console.log(err);
    });
  });

  socket.on('getNearby', (data) => { // returns nearby devices
    console.log('nearby');
    socket.emit('foundNearby', {
      found: foundDevices
    });
  });

  socket.on('connectTo', (data) => { // connects to MAC
    console.log('Connecting to ', data.address);
    bluetoothConnect(data.address);
  });

  socket.on('amIconnected', (data) => {
    console.log('Am I connected ('+connection+')');
    socket.emit('resAmIconnected', {status: connection});
  });

  socket.on('disconnect', (data) => {
    if(data.sure){
      console.log('Disconnecting');
      btSerial.close();
      connection = false;
    }
  });

  socket.on('getAngleAndDistance', (data) => { 
    console.log('Get angle and distance');
    async.compassReady = false;
    btSerial.write(new Buffer('d', 'utf-8'), function(err, bytesWritten) {
      if (err) console.log(err);
    });
    socket.broadcast.emit('getCompass', {}); // sends request to Android for fetching angle

    var interval = setInterval(()=>{
      if(async.compassReady && async.arduReady) {
        socket.emit('position', {distance: async.dataFromArdu.dst, nowAngle: async.angle});
        clearInterval(interval);
        console.log("Sent");
      }
      //console.log(async.compassReady+' '+async.arduReady);
    }, 10);
  });

  socket.on('resCompass', (data) => { // returns angle got from Android
    console.log('Res compass');
    async.angle = data.ang;
    async.compassReady = true;
    //socket.emit('angle', {angle: data.ang});
  });
});