/*
Here we a prepared to receive a POST message from the client,
and acknowledge that, but still no attempt to extract the data or parse it
*/

/*
Use browser to view pages at http://localhost:3000/canvasWithTimer.html

//collaboration through polling
//=============================

When the blue cube is moved with the arrow keys, a POST message will be
sent to the server when the arrow key is released, also while the key is
held down.

Clients also request the position of the movingBox by polling the server.
The smoothness is thus affected by the rate at which the polling timer
runs. The trade off is smooth behaviour vs network traffic.

This polling app is a great candidate to use web sockets instead of polling.

Only the client moving the box will drop waypoints, the other clients don't
see the local waypoints, just their own.
*/

//Cntl+C to stop server (in Windows CMD console)

var http = require('http'); //need to http
var fs = require('fs'); //need to read static files
var url = require('url');  //to parse url strings

var counter = 1000; //to count invocations of function(req,res)

//server maintained location of moving box
var gridData = []; //will be over written by clients
var winners = [];
var players = [];

var ROOT_DIR = 'html'; //dir to serve static files from

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
    var ext, type;
    for (ext in MIME_TYPES) {
        type = MIME_TYPES[ext];
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            return type;
        }
    }
    return MIME_TYPES['txt'];
};

var checkFinal = function(player){
  if(gridData.length == 16*4){
    gridData = [];
    players = [];

    // percorre o array contando a frequencia que cada player aparece
    for(var x=0; x < gridData.length; x++) {
      
    }
    // winners.push(player);
  }
};


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

http.createServer(function (request,response){
     var urlObj = url.parse(request.url, true, false);
     console.log('\n============================');
	   console.log("PATHNAME: " + urlObj.pathname);
     console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
     console.log("METHOD: " + request.method);
	 
     var receivedData = '';

     //attached event handlers to collect the message data
     request.on('data', function(chunk) {
        receivedData += chunk;
     });
	 
	 //event handler for the end of the message
     request.on('end', function(){
        console.log('REQUEST END: ');
        console.log('received data: ', receivedData);
        console.log('type: ', typeof receivedData);
		
		//if it is a POST request then echo back the data.
		/*
		A post message will be interpreted as either a request for
		the location of the moving box, or the location of the moving box
		being set by a client.
		If the .x and .y attributes are >= 0 
		treat it as setting the location of the moving box.
		If the .x and .y attributes are < 0 treat it as a request (poll)
		for the location of the moving box.
		In either case echo back the location of the moving box to whatever client
		sent the post message.
		
		Can you think of a nicer API then using the numeric value of .x and .y
		to indicate a set vs. get of the moving box location.
		*/
		if(request.method == "POST"){
      if(urlObj.pathname == '/colorData'){
       var dataObj = JSON.parse(receivedData);
       if(dataObj.x >=0 && dataObj.y >= 0){
         //Here a client is providing a new location for the moving box
         //capture location of moving box from client
            gridData.push(dataObj);
            console.log('received data object: ', dataObj);
            console.log('type: ', typeof dataObj);
            checkFinal(dataObj.player);

            
         } 
       //echo back the location of the moving box to who ever
       //sent the POST message
           response.writeHead(200, {'Content-Type': MIME_TYPES["json"]}); 
           response.end(JSON.stringify({gridData:gridData})); //send just the JSON object
      }

      if(urlObj.pathname == '/createPlayer'){
        var dataObj = JSON.parse(receivedData);

        var player = {
          name : dataObj.name,
          color : getRandomColor()
        };

        response.writeHead(200, {'Content-Type': MIME_TYPES["json"]}); 
        response.end(JSON.stringify(player)); //send just the JSON object
      }
		}
     });
	 
     if(request.method == "GET"){
        if(urlObj.pathname == '/updateData'){
           response.writeHead(200, {'Content-Type': MIME_TYPES["json"]}); 
           response.end(JSON.stringify({gridData:gridData})); //send just the JSON object
        }else{
           //handle GET requests as static file requests
         fs.readFile(ROOT_DIR + urlObj.pathname, function(err,data){
           if(err){
          //report error to console
              console.log('ERROR: ' + JSON.stringify(err));
          //respond with not found 404 to client
              response.writeHead(404);
              response.end(JSON.stringify(err));
              return;
             }
             response.writeHead(200, {'Content-Type': get_mime(urlObj.pathname)});
             response.end(data);
           });
        }

	 }


 }).listen(3000);

console.log('Server Running at http://127.0.0.1:3000  CNTL-C to quit');