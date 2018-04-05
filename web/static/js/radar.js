var mapObject = new RadarChart(document.getElementById('environmentMap').getContext('2d'));

mapObject.init({MinAngle: 0, MaxAngle: 360, AngleScale: 15, ValueScale: 10, ValueScaleByMaxMin: false, PointColor : "rgba(151,187,205,1)", PointStrokeColor : "#fff", ValueScaleMax: 80, ValueScaleMin: 0});

mapObject.drawDiagram();

//let allPoints = [];

function calcAng(x, y){
  let angle = Math.atan2(Math.abs(y), Math.abs(x))*180/Math.PI;

  if(x>0 && y>0) angle+= 0;
  else if(y > 0 && x < 0)  angle += 90;
  else if(x<0)  angle += 180;
  else angle += 270;

  console.log(x, y, angle);

  return angle;
}

function getCordsFor(x, y, dst){
  let len = dst/4;
  len = len < 80 ? dst : 80;
  let ang = calcAng(x, y);
  return [len, ang];
}

function addToChart(dst, nowAngle){
  //console.log(x, y);
  //allPoints.push([x, y]);
  //var info = getCordsFor(x, y, dst);
  //console.log(info);
  let info = [dst, nowAngle];
  try{
    mapObject.addPoint(info[0], info[1], 30, 1);
    mapObject.drawDiagram();
  } catch (e) {
    console.log(e);
  }
}