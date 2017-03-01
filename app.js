// developed by apickelsimer
// 2-28-17
// API usage
// $curl --insecure --cert-type pem --cert user.p12 "https://localhost:9000/" --pass "Password1"

var express = require('express');
var fs = require('fs');
var https = require('https');
var clientCertificateAuth = require('client-certificate-auth');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var opts = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.pem'),
  ca: fs.readFileSync('./ssl/ca.pem'),
  requestCert: true,
  rejectUnauthorized: false,
  passphrase: "Password1"
};

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/service/:service/', function(req, res, next) {
  //mutual tls
  if(req.client.authorized) {
      //mock end points
      var service = req.param('service');
      var path = './data/' + req.param('service') + '.json';
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
    }
    else {
    console.log("Response sent. Unauthorized 401");
    res.send("unauthorized or invalid cert");
  }

});

const port = process.env.PORT || 9000;
https.createServer(opts, app).listen(port);