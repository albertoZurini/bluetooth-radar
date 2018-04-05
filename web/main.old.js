var httpPort = 8080, socketPort = 8081;

var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var io = require('socket.io')(socketPort);
var express = require('express');
var app = express();
var http = require('http').Server(app);

var dataFromArdu, foundDevices = [], start, connection = false;

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
          dataFromArdu = data;
        } else if(data.indexOf('}') !== -1){
          dataFromArdu += data;
          io.sockets.emit('position', JSON.parse(dataFromArdu));
        } else {
          dataFromArdu += data;
        }
				console.log(dataFromArdu);
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

setTimeout(function(){
  btSerial.inquire(); // start searching devices
}, 0);

setInterval(function(){
  foundDevices = [];
  btSerial.inquire(); // start searching devices
}, 30000); // Bluetooth scan tooks 12.8s


btSerial.on('found', function(address, name) {

  console.log('Found ', name, ' at ', address);
  foundDevices.push({name: name, address: address});
  io.sockets.emit('newNearby', {name: name, address: address});
	
});

io.on('connection', function (socket) {

  console.log('New connection');

  socket.on('getMessage', function(data){
    socket.emit('readMessage', {
      msg: dataFromArdu
    });
  });

  socket.on('goAhead', function(data){
    console.log('Go Ahead');
    socket.broadcast.emit('getCompass', {});
    btSerial.write(new Buffer('c', 'utf-8'), function(err, bytesWritten) {
      if (err) console.log(err);
    });
  });

  socket.on('resCompass', function(data){
    console.log(data);
  });

  socket.on('getNearby', function(data){
    console.log('nearby');
    socket.emit('foundNearby', {
      found: foundDevices
    });
  });

  socket.on('connectTo', function(data){
    console.log('Connecting to ', data.address);
    bluetoothConnect(data.address);
  });

  socket.on('amIconnected', function(data){
    console.log('Am I connected');
    socket.emit('resAmIconnected', {status: connection});
  });

  socket.on('disconnect', function(data){
    if(data.sure){
      console.log('Disconnecting');
      btSerial.close();
      connection = false;
    }
  });

});