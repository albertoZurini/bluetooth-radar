var socket = io('0.0.0.0:8081');
var amIconnected = false;

function openBtPopup(){
  $(".blueConnect").fadeIn();
  $('.shadow').fadeIn();
  $('.content').toggleClass('blurred');
}

function closeBtPopup(){
  $('.blueConnect').fadeOut();
  $('.shadow').fadeOut();
  $('.content').toggleClass('blurred');
}

socket.on('getMessage', function(data){
  console.log(data)
});

socket.on('foundNearby', function(data){
  if(data.found.length == 0) {
    $("#nearbyDevices").text('Nothing found');
    return;
  }

  $('#nearbyDevices').empty();

  $('#nearbyDevices').append('<form action="" id="blueDevices">')
  let count = 0;
  for(let device of data.found){
    let toAdd = ` <input type="radio" id="`+count+`"
                    name="blueAdd" value="`+device.address+`">
                  <label for="`+count+`">`+device.name+' @ '+device.address+`</label>`;
    $("#nearbyDevices").append(toAdd);
    count++;
  }
  
  $('#nearbyDevices').append('</form>');
  $('#nearbyDevices').append('<br/><a class="waves-effect waves-light btn" id="connect">Connect</a>');
});

socket.on('resAmIconnected', function(data){
  amIconnected = data.status;
});

socket.on('blueConnect', function(data){
  console.log(data);
  if(data.rsp){
    Materialize.toast('Successfully connected to device', 4000);
    amIconnected = true;
    $(".preloader-wrapper").fadeOut();
    closeBtPopup();
  } else {
    Materialize.toast('Can\'t connect to device', 4000);
  }
});

socket.on('newNearby', function(data){/*
  let count = $('#blueDevices').find('input').length+1;
  let toAdd = ` <input type="radio" id="`+count+`"
                    name="blueAdd" value="`+data.address+`">
                  <label for="`+count+`">`+data.name+' @ '+data.address+`</label>`;
  $("#blueDevices").append(toAdd);*/
  if (amIconnected) return;
  Materialize.toast('New devices found!', 4000);
});

socket.on('position', function(data){
  addToChart(data.distance, data.nowAngle);
  console.log(data);
});

$('#bluetooth').click(function(){
  //open popup
  openBtPopup();
});

$('#scan').click(function(){
  socket.emit('getNearby', {});
  $('#nearbyDevices').text('Loading....');
});

$(".closePopup").click(function(){
  closeBtPopup();
});

$(document).on('click', '#connect', function(){
  let addr = $("input[name=blueAdd]:checked").val();
  if(addr == undefined) return;

  socket.emit('connectTo', {address: addr});

  $(".preloader-wrapper").fadeIn();
});

var radarLoop;

$('#toggleRadar').click(function(){

  socket.emit('toggleArduinoRotation', {});

  if($(this).text() == 'Start radar'){

    $(this).text('Stop radar');
    socket.emit('getAngleAndDistance', {});
    radarLoop = setInterval(function(){
      socket.emit('getAngleAndDistance', {});
    }, 100);

  } else {

    $(this).text('Start radar');
    clearInterval(radarLoop);

  }

});

// Initialization

socket.emit('stopArduinoRotation', {});
socket.emit('amIconnected', {});
setTimeout(()=>{
  if(amIconnected)  Materialize.toast('Connected to bluetooth radar', 4000);
}, 200);