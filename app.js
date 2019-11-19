var express = require('express');
var fs = require('fs')
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/service/:service/', function(req, res, next) {

  var service = req.params.service.toString();
  var path = './data/' + service + '.json';
  var a = require(path);

  switch(service){
     case 'weather' :
         setTimeout(function () {
          res.json(a);
         }, 10);
             break;
     case 'flightdetails' :
         setTimeout(function () {
          res.json(a);
         }, 49);
             break;
     case 'profile' :
         setTimeout(function () {
          res.json(a);
         }, 118);
             break;
     case 'flights' :
         setTimeout(function () {
          res.json(a);
         }, 256);
             break;
    case 'flightdepartdetails' :
         setTimeout(function () {
          res.json(a);
         }, 399);
             break;
    case 'airports' :
         setTimeout(function () {
          res.json(a);
         }, 681);
             break;
    case 'flighthistory' :
         setTimeout(function () {
          res.json(a);
         }, 1481);
             break;
     default:
            res.json(a);
            break;
  }
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))