var express = require('express');
var fs = require('fs')
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
WeightedRandomSelector = require('./wrs.js');

const request = require('request');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var latencyAnamolyOn = false;
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
    ["30to50",      5],
    ["50to100",     1],
    ["100to500",     2],
    ["500to1000",    1],
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

function randomResponseCode(method) {
  var respCodeArray

  if (method == "get")
  {
    respCodeArray = [
      ["200",90],
      ["400",1],
      ["401",1],
      ["403",1],
      ["404",10],
      ["500",1],
      ["503",1]
    ];
  }
  else if (method == "put")
  {
    respCodeArray = [
      ["200",90],
      ["400",0],
      ["401",0],
      ["403",0],
      ["404",10],
      ["500",5],
      ["503",0]
    ];
  }
  else if (method == "post")
  {
    respCodeArray = [
      ["201",90],
      ["400",0],
      ["401",0],
      ["403",10],
      ["404",10],
      ["500",1],
      ["503",10]
    ];
  }
  else if (method == "delete")
  {
    respCodeArray = [
      ["200",90],
      ["400",0],
      ["401",1],
      ["403",10],
      ["404",10],
      ["500",1],
      ["503",1]
    ];
  }
  var pickedRespCode = new WeightedRandomSelector(respCodeArray);
  var respCode = pickedRespCode.select()[0];
  console.log("response code :" + respCode);
  return respCode;
};

function fetchDataGCS(data){
  var url = 'https://storage.googleapis.com/fazio-259604.appspot.com/' + data + '.json';
  return new Promise((resolve, reject) => {
      request(url, function (error, response, body) {
        resolve(body);
      });
  });
}

async function sendResp(res, data, method) {
  try{
    var a;
    //fetch from local if avil
    var path = './data/' + data + '.json';
    if (fs.existsSync(path)) {
      a = require(path);
    }
    else{
      //fetch from cache
      a = myCache.get(data);
      //if not avail fetch from gcs
      if ( a == undefined ){
          a = await fetchDataGCS(data);
          //cache for 60s
          myCache.set(data, a, 60 );
      }
      
    }
    var actualRespCode = randomResponseCode(method)
    if (actualRespCode == 200)
    {
      res.type("json").send(a)
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

  if (nextLatencyAnamolyStartTime == null)
  {
    //set end time to now
    lastLatencyAnamolyEndTime = now;
    //set time until next anamoly
    nextLatencyAnamolyDuration = getRndInteger(12,24)
    //set next anamoly for a random time later
    nextLatencyAnamolyStartTime = addHours(lastLatencyAnamolyEndTime, nextLatencyAnamolyDuration);

    console.log("lastLatencyAnamolyStartTime: " + lastLatencyAnamolyStartTime);
    console.log("latencyAnamolyDuration: " + latencyAnamolyDuration + " minutes");
    console.log("lastLatencyAnamolyEndTime: " + lastLatencyAnamolyEndTime);
    console.log("nextLatencyAnamolyDuration: " + nextLatencyAnamolyDuration + " hours")
    console.log("nextLatencyAnamolyStartTime: " + nextLatencyAnamolyStartTime);

  }

  if (now > nextLatencyAnamolyStartTime)
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

app.get('/:foo/:bar/', function(req, res, next) {
  var data = req.params.bar.toString();
  setTimeout(function () { sendResp(res, data, "get") }, randomLatency());
});

app.put('/:foo/:bar/', function(req, res, next) {
  var data = req.params.bar.toString();
  setTimeout(function () { sendResp(res, data, "put") }, randomLatency());
});

app.post('/:foo/:bar/', function(req, res, next) {
  var data = req.params.bar.toString();
  setTimeout(function () { sendResp(res, data, "post") }, randomLatency());
});

app.delete('/:foo/:bar/', function(req, res, next) {
  var data = req.params.bar.toString();
  setTimeout(function () { sendResp(res, data, "delete") }, randomLatency());
});

app.get('/status', function(request, response) {
    response.send(200, "up");
});

// default behavior
app.all(/^\/.*/, function(request, response) {
    response.header('Content-Type', 'application/json');
    response.send(404, '{ "message" : "This is not the server you\'re looking for." }\n');
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))