/*
Simple server/client pair of node.js apps using the POST
http method rather than GET.

JSON objects are passed back an forth between the 
client and server node.js apps using the POST method

Note: This example does not support a browser client
It will crash if you visit it with a browser
(As an exercise you can add browser support as well)
*/


var http = require('http'); //need to http
var url = require('url');
var qstring = require('querystring');
var fs = require('fs');
var temperature = 20;  //degrees celsius
var temperatureDefault = 23;
var furnaceState = 'ON';
var tempTimer;
var defaultlocation = "ottawa";
var weatherInfo = "";
var ROOT_DIR = 'html'; //dir to serve static files from
getWeather(defaultlocation);

var MIME_TYPES = {
    'css': 'text/css',
    'gif': 'image/gif',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript', //should really be application/javascript
    'json': 'application/json',
    'png': 'image/png',
    'txt': 'text/text'
};

var get_mime = function(filename) {
    //answer MIME type based on file extension
    var ext, type;
    for (ext in MIME_TYPES) {
        type = MIME_TYPES[ext];
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            return type;
        }
    }
    return MIME_TYPES['txt'];
};

tempTimer = setInterval(tempTimerHandler, 5*1000);

// temperature handler
function tempTimerHandler(){
  if(furnaceState == "ON"){
    if(temperature < temperatureDefault){
      temperature++;
    }else{
      furnaceState="OFF";
    }
  }else{
    if(temperature < temperatureDefault){
      furnaceState="ON";
    }else{
      temperature=temperature-3;
    }
  }
}

function parseWeather(weatherResponse) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });
  weatherResponse.on('end', function () {
    weatherInfo = JSON.parse(weatherData);
    console.log(weatherInfo.main);
    temperature = weatherInfo.main.temp - 273,15;
  });
}

function getWeather(city){
// new as of 2015: you need to provide an appid with your request
  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/weather?q=' + city + 
  '&appid=f45b6d23576028c0609371dd5060e010'
  };
  http.request(options, function(weatherResponse){
    parseWeather(weatherResponse);
  }).end();
}

http.createServer(function (request,response){
     var jsonData = '';
     var urlObj = url.parse(request.url, true, false);
     console.log('\n============================');
	   console.log("PATHNAME: " + urlObj.pathname);
     console.log("METHOD: " + request.method);

     if (request.method == "POST"){
      request.on('data', function(chunk) {
        jsonData += chunk;
      });
      // to change the city
     	if(urlObj.pathname == "/weathercity"){
        console.log("city change requested");
		    request.on('end', function() {
		      var postParams = qstring.parse(jsonData);
		      getWeather(postParams.city);
		    });
		  }
    // response for the changing of temperature by the user
    if(urlObj.pathname == "/furnacestate"){
      request.on('end', function(){
        var reqObj = JSON.parse(jsonData);
        console.log('reqObj: ', reqObj);
        if(reqObj.temperature === "increase"){
          temperatureDefault++;
        }else{
          temperatureDefault--;
        }
        var resObj = {
            'temperature' : temperature,
            'furnace' : furnaceState};
        response.writeHead(200);
        response.end(JSON.stringify(resObj));
     });
    }
    
      // simple response of the state of furnace and the temperature
		     request.on('end', function(){
		        var reqObj = JSON.parse(jsonData);
		        console.log('reqObj: ', reqObj);
		        var resObj = {
                'temperatureDefault' :temperatureDefault,
		            'temperature' : temperature,
		            'furnace' : furnaceState};
		        response.writeHead(200);
		        response.end(JSON.stringify(resObj));
		     });
	  	
	  }
    //if a GET request was received
    if(request.method === "GET"){  
        //the client has made a request for a static resource
        var file_path = ROOT_DIR + urlObj.pathname;
        
        //if the web page was requested, set the filepath for the static html page
        if(urlObj.pathname === '/')
          file_path = ROOT_DIR + '/index.html';

        // get the weather info
        if(urlObj.pathname === "/weatherinfo"){
          response.writeHead(200);
          response.end(JSON.stringify(weatherInfo));
        }

        //read the data from the constructed filepath
        fs.readFile(file_path, function(err, data){
          
          //if an error has occured, send a response to the client indicating that the file could not be retrieved
          if(err){
            console.log('Could not locate file');
            response.writeHead(200, {'Content-Type': MIME_TYPES["text"]});
            response.end(JSON.stringify({'file_found': false}));
          }
          //otherwise, the file was successfully read
          else{
            response.writeHead(200, {'Content-Type': get_mime(file_path)});
            response.end(data);
          }
        });
      }
 }).listen(3000);

console.log('Server Running at http://127.0.0.1:3000  CNTL-C to quit');


