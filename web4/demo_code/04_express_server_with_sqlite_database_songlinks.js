/*
Basic connect server using connect middleware and SQLite database.
Here we query the database to find song details that a user
can request through a query like http://localhost:3000/find?title=Love

This is an Express 4.x application
Note to change this to an express application from Node.js/connect 
just required two lines of change:
require('express') instead of require('connect')
and app = express() rather than app = connect()

This is because express uses, and exposes all the capabilities 
of the connect dispatcher.

This example assumes a data/db_1200iRealSongs exists.

requires npm modules:
express
sqlite3

Application of middleware example:
Here we register middleware to do http 401 'BASIC' authentication.

When the browser receives a 401 status response with a
'WWW-Authenticate' header set it will prompt the user
for a userid and password. The userid:password string will then
be "scrambled" as a base64 encoding will be sent with each
subsequent request.

Here our authenticate middleware will determine it an authorization
header is included with the client request, and if not send a 401 authenticate
response. (The browser should then prompt the user for the userid and password.

If an authorization header is present the userid and password is decoded and
checked against valid users before  proceeding to middleware that serve pages 

Here our users are in an sqlite3 database.
API for using sqlite3 API: https://github.com/mapbox/node-sqlite3/wiki/API

Once users are authenticated the can visit /users.html to see all the users
and visit /find.html?title=Girl to find all the songs that have 'Girl' in the
title.
*/

//Cntl+C to stop server (in Windows CMD console)

var http = require('http');
var express = require('express');
var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var bodyParser = require("body-parser");
var url = require('url');
var dialog = require('dialog');
var db = new sqlite3.Database('data/assignment4web');
var app = express(); //create express middleware dispatcher
var urlObj; //we will parse user GET URL's into this object
var studentNumber;
var questions;
var question;
var hintCount = 0;
var maxHintCount = 3;
//Define middleware functions
/*
function(request, response, next){
   //request is the http request object
   //response is the http response object
   //next is the next-in-line middeware that needs to be called
   //this function should either respond to the client -ending the
   //middleware chain, or call next()
}
*/


function methodLogger(request, response, next){           
		   console.log("");
		   console.log("================================");
		   console.log("Console Logger:");
		   console.log("METHOD: " + request.method);
		   console.log("URL:" + request.url);
		   next(); //call next middleware registered
}

function headerLogger(request, response, next){           
		   console.log("Headers:")
           for(k in request.headers) console.log(k);
		   next(); //call next middleware registered
}

function authenticate(request, response, next){
    /*
	Middleware to do BASIC http 401 authentication
	*/
    var auth = request.headers.authorization;
	// auth is a base64 representation of (username:password) 
	//so we will need to decode the base64 
	if(!auth){
 	 	//note here the setHeader must be before the writeHead
		response.setHeader('WWW-Authenticate', 'Basic realm="need to login"'); 
        response.writeHead(401, {'Content-Type': 'text/html'});
		console.log('No authorization found, send 401.'); 
 		response.end();  
	}
	else{
	    console.log("Authorization Header: " + auth);
        //decode authorization header
		// Split on a space, the original auth 
		//looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part 
        var tmp = auth.split(' ');   		
		
		// create a buffer and tell it the data coming in is base64 
        var buf = new Buffer(tmp[1], 'base64'); 
 
        // read it back out as a string 
        //should look like 'ldnel:secret'		
		var plain_auth = buf.toString();    
        console.log("Decoded Authorization ", plain_auth); 
		
        //extract the userid and password as separate strings 
        var credentials = plain_auth.split(':');      // split on a ':' 
        var username = credentials[0]; 
        studentNumber = credentials[1]; 
        console.log("User: ", username); 
        console.log("Student Number: ", studentNumber); 
		
		var authorized = false;
		//check database users table for user
		db.all("SELECT student_name, student_number FROM students", function(err, rows){
		for(var i=0; i<rows.length; i++){
		      if(rows[i].student_name == username & rows[i].student_number == studentNumber) authorized = true;		     
		}
		if(authorized == false){
 	 	   //we had an authorization header by the user:password is not valid
		   response.setHeader('WWW-Authenticate', 'Basic realm="need to login"'); 
           response.writeHead(401, {'Content-Type': 'text/html'});
		   console.log('No authorization found, send 401.'); 
 		   response.end();  
		}
        else
		  next();				
		});
	}

	//notice no call to next()
  
}

function respondToClient(request, response, next){
    response.end();
	//notice no call to next()
  
}

function addHeader(request, response, next){
        // about.html
        var title = 'COMP 2406:';
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<!DOCTYPE html>');
        response.write('<html><head><title>About</title></head>' + '<body>');
        response.write('<h1>' +  title + '</h1>');
		response.write('<hr>');
		next();
}
function addFooter(request, response, next){
 		response.write('<hr>');
		response.write('<h3>' +  'Carleton University' + '</h3>');
		response.write('<h3>' +  'School of Computer Science' + '</h3>');
        response.write('</body></html>');
		next();

}
function getUsersPage(request, response, next){
        // users.html
		console.log("RUNNING ADD USERS");
        response.write('<h2>' +  'USERS' + '</h2>');
		db.all("SELECT userid, password FROM users", function(err, rows){
		  for(var i=0; i<rows.length; i++){
              console.log(rows[i].userid + ": " + rows[i].password);
			   response.write('<p>' + rows[i].userid + ": " + rows[i].password + '</p>');
		  }
          next();		  
		});

}

function parseURL(request, response, next){
	var parseQuery = true; //parseQueryStringIfTrue 
    var slashHost = true; //slashDenoteHostIfTrue 
    urlObj = url.parse(request.url, parseQuery , slashHost );
    console.log('path: ' + urlObj.path);
    console.log('query: ' + urlObj.query);	
    for(x in urlObj.query) console.log(x + ': ' + urlObj.query[x]);
	next();

}
		
 function getIndexPage(request, response, next){
    // index
    response.write('<p>'  +  'Using npm express module and middleware'  + '</p>');
    response.write('<p>'  +  'Example of using sqlite relational database'  + '</p>');

    var sql = "SELECT testid,testname FROM test";
    hintCount = 0; // reset before start the test
    response.write('<form method="post" action="/start">');
    db.all(sql, function(err, rows) {
    	for(var i=0; i<rows.length; i++){
    		response.write('<p><input type="radio" name="testselection" value="'+ rows[i].testid  +'">'  + rows[i].testname+ '</p>');
    	}
		response.write('<p><input type="submit" value="Start Test"> </p>');
		response.write('</form>');
    	next();
		});    
 }



 function saveStudentAnswer(questionid,answerid){
	var stmt = db.prepare("INSERT OR REPLACE INTO student_answers (student_number, questionid, answerid) VALUES (?,?,?)");
	stmt.run(studentNumber,questionid,answerid);
	stmt.finalize();
 }

 function getStartTest(request,response,next){
 	if(request.body.testselection) {
		var sql = "select questions.questionid,questiontext,correct_answerid " +
					"from test_questions,questions " + 
 					"where test_questions.questionid = questions.questionid " + 
 					  "and test_questions.testid = "+request.body.testselection;
 		db.all(sql, function(err, rows) {
 			questions = rows;
			printQuestion(response,0,next); // initial state
  		});
 	}else{
 		// verify final
 		if((questions.length-1) < urlObj.query['question']){
 			if(request.body.answerid){ // with answers
	 			if(question)
	 				saveStudentAnswer(question.questionid,request.body.answerid);
	 		}
	 		response.write('<a href="/test">Back to test</a>');
	 		next();
 		}else{
 			if(urlObj.query['question']){
 				if(urlObj.query['answerid'] && hintCount < maxHintCount){ // case when student asked for hint
	 				console.log("hint");
	 				var sql = "select questionid from questions where correct_answerid = "+urlObj.query['answerid']+" and questionid = "+question.questionid;
	 				db.all(sql, function(err, rows) {
	 					if(rows.length > 0){
	 						dialog.info('YES');
	 					}else{
	 						dialog.info('NO');
	 					}
			  		});
	 				hintCount++;
	 			}
	 			if(request.body.answerid){ // with answers
	 				if(question)
	 					saveStudentAnswer(question.questionid,request.body.answerid);
	 			}
	 			printQuestion(response,urlObj.query['question'],next);
	 		}else{
	 			if(question) // just to deal with the initial case 
	 					printQuestion(response,question.questionid,next);
	 		}
 		}
 	}
 }


function printQuestion(response,questionNumber,next){
	question = questions[questionNumber];

	var sql = "select answer.answerid,answertext from answer,alternatives "+ 
				"where answer.answerid = alternatives.answerid and questionid = " + questionNumber;
	if(question){
		response.write('<p>'+question.questiontext+'</p>');

		db.all(sql, function(err, rows) {
			var nextQuestion = question.questionid+1;// missing the verifications
	        var previousQuestion = question.questionid-1; // missing the verifications
	        response.write('<p> hint count ' + (maxHintCount-hintCount));
			response.write('<form method="post" action="/start?question='+ nextQuestion +'">');
	 		for(var i=0; i<rows.length; i++){
	        	response.write('<p><input type="radio" name="answerid" value="'+ rows[i].answerid  +'">'  + rows[i].answertext+ '</p>');
	        	if(hintCount < maxHintCount){
	 				response.write('<a href="/start?question='+question.questionid+'&answerid='+rows[i].answerid+'"><img src="http://shots.jotform.com/kade/Screenshots/blue_question_mark.png" height="13px"/></a>');
	 			}
	        }
	        if(questions[questions.length-1] == question){
	        	response.write('<p><input type="submit" value="Finish"> </p>');
	        }else{
	        	response.write('<p><input type="submit" value="Next Question"> </p>');
	        }
	        response.write('</form>');
	        response.write('<hr>');
	        response.write('<a href="/start?question='+previousQuestion+'">Previous</a>');
	 		next();
	  	});
	}else{
		next();
	}
}
		


//register middleware with dispatcher
//ORDER MATTERS HERE
//app.use(methodLogger); 
//app.use(headerLogger);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(parseURL);
app.use(authenticate); //authenticate user
app.use(addHeader);
app.use('/start', getStartTest);
app.use('/users', getUsersPage);
app.use('/test', getIndexPage);
app.use(addFooter);
app.use(respondToClient);

//create http-express server
http.createServer(app).listen(3000);

console.log('Server Running at http://127.0.0.1:3000  CNTL-C to quit');