
/*
Simple example of a node.js HTTP client using POST method instead of GET.

To test:
Start the peer server first then each time this app 
is run it should get some data from the server. 
Client and server pass JSON object strings between each other.

*/


var http = require('http'); //need to http


var options = {
  hostname: 'localhost',
  port: '3000',
  path: '/',
  method: 'POST'
}


function readJSONResponse(response){
  var responseData = '';
  response.on('data', function(chunk){responseData += chunk});
  response.on('end', function(){
    var dataObj = JSON.parse(responseData);
    console.log('Raw Response: ' + responseData);
    console.log('TEMP: ' + dataObj.temperature);
    console.log('FURNACE STATE: ' + dataObj.furnace);
  });
}

setInterval(function(){
               var req = http.request(options, readJSONResponse);
			   //write a json string
               req.write('{"temperature" : "?", "furnace": "?"}');
               req.end();
 		    }, 5000);
