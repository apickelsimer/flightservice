var express = require('express');
var fs = require('fs')
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
WeightedRandomSelector = require('./wrs.js');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var latencyAnamolyOn;
var latencyAnamolyDuration;
var lastLatencyAnamolyStartTime;
var lastLatencyAnamolyEndTime;
var nextLatencyAnamolyStartTime;
var nextLatencyAnamolyDuration;

var lastResponseAnamolyTime;
var lastResponseAnamolyTime;

function getRndInteger(min, max) {

    return Math.floor(Math.random() * (max - min) ) + min;
};

function randomLatency() {

  var latencyArray = [
    ["10to20",      99],
    ["30to50",      20],
    ["50to100",     10],
    ["100to500",     3],
    ["500to1000",    2],
    ["2500to5000",   1]
  ];


  var latency;
  
  //check if its time to run an anamoly
  if (checkLatencyAnamoly() == true) 
  {
    //override pick
    latency = "2500to5000";
  }
  else //otherwise pick random latency from weighted array
  {
    var picked = new WeightedRandomSelector(latencyArray);
    latency = picked.select()[0];
  }

  console.log("latency: " + latency);

  switch(latency){
    case '10to20' :
         latency = getRndInteger(10,20);
            break;
    case '30to50' :
         latency = getRndInteger(30,50);
            break;
    case '50to100' :
          latency = getRndInteger(50,100);
            break;
    case '100to500' :
          latency = getRndInteger(100,500);
            break;
    case '500to1000' :
          latency = getRndInteger(500,1000);
            break;
    case '2500to5000' :
          latency = getRndInteger(2500,5000);
            break;
    default:
          latency = getRndInteger(10,50);
            break;
  }
  console.log("latency set: " + latency);
  return latency;
};

function randomResponseCode() {
  var respCodeArray = [
    ["200",90],
    ["400",1],
    ["401",1],
    ["403",1],
    ["404",10],
    ["500",1],
    ["503",1]
  ];
  var pickedRespCode = new WeightedRandomSelector(respCodeArray);
  var respCode = pickedRespCode.select()[0];
  console.log("response code :" + respCode);
  return respCode;
};

function sendResp(res, service) {
  try{
    var path = './data/' + service + '.json';
    var a = require(path);
    var actualRespCode = randomResponseCode()
    if (actualRespCode == 200)
    {
      res.json(a);
    }
    else
    {
      res.sendStatus(actualRespCode);
    }
  }
  catch(e)
  {//do something
    res.sendStatus(404);
    console.log("error: " + e + " : sending 404");
  }
};

function addMinutes(date, minutes) {
    
    return new Date(date.getTime() + minutes*60000); 
}

function addHours(date, hours) {
    
    return new Date(date.getTime() + hours*3600000);
}

function checkLatencyAnamoly(){
  var now = new Date();
  if (nextLatencyAnamolyStartTime == null || now > nextLatencyAnamolyStartTime)
  {
    console.log("starting anamoly...");
    //start anamoly now
    lastLatencyAnamolyStartTime = now;
    //set random duration
    latencyAnamolyDuration = getRndInteger(5,10); //5-10 minutes
    //set end time
    lastLatencyAnamolyEndTime = addMinutes(now, latencyAnamolyDuration);
    //turn on
    latencyAnamolyOn = true;
    //set time until next anamoly
    nextLatencyAnamolyDuration = getRndInteger(12,24)
    //set next anamoly for a random time later
    nextLatencyAnamolyStartTime = addHours(lastLatencyAnamolyEndTime, nextLatencyAnamolyDuration);

    console.log("lastLatencyAnamolyStartTime: " + lastLatencyAnamolyStartTime);
    console.log("latencyAnamolyDuration: " + latencyAnamolyDuration + " minutes");
    console.log("lastLatencyAnamolyEndTime: " + lastLatencyAnamolyEndTime);
    console.log("nextLatencyAnamolyDuration: " + nextLatencyAnamolyDuration + " hours")
    console.log("nextLatencyAnamolyStartTime: " + nextLatencyAnamolyStartTime);

    return true;
  }
  else if (latencyAnamolyOn == true && now > lastLatencyAnamolyEndTime)
  {
      console.log("ending anamoly...");
      //anamoly time expired, turn it off
      latencyAnamolyOn = false;
      console.log("latencyAnamolyOn: " + latencyAnamolyOn)
      return false;
  }
  else if (latencyAnamolyOn == false && now < nextLatencyAnamolyStartTime)
  {
      //anamoly is off, next anamoly has not started
      latencyAnamolyOn = false;
      console.log("latencyAnamolyOn: " + latencyAnamolyOn)
      return false;
  }
  else 
  {
    //do nothing - latency anamoly is running and time hasn't expired yet
    console.log("latencyAnamolyOn: " + latencyAnamolyOn)
    return true;
  }
};

function checkResponseCodeAnamoly(){
    
    //TODO
};

app.get('/service/:service/', function(req, res, next) {
  var service = req.params.service.toString();
  setTimeout(function () { sendResp(res, service) }, randomLatency());
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))