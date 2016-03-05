/*

Javasript to handle mouse dragging and release
to drag a string around the html canvas
Keyboard arrow keys are used to move a moving box around

Here we are doing all the work with javascript and jQuery. (none of the words
are HTML, or DOM, elements. The only DOM element is just the canvas on which
where are drawing.

This example shows examples of using JQuery
JQuery syntax:
$(selector).action();
e.g.
$(this).hide() - hides the current element.
$("p").hide() - hides all <p> elements.
$(".test").hide() - hides all elements with class="test".
$("#test").hide() - hides the element with id="test".

Mouse event handlers are being added and removed using jQuery and
a jQuery event object is being passed to the handlers

Keyboard keyDown handler is being used to move a "moving box" around

Notice in the .html source file there are no pre-attached handlers.

*/

				
var wayPoints = []; //locations were this client moved the box to
					
var timer; //used to control the free moving word
var pollingTimer; //timer to poll server for location updates

var wordBeingMoved; //word being dragged by mouse
var wordTargetRect = {x:0,y:0,width:0,height:0}; //bounding box around word being targeted


var canvas = document.getElementById('canvas1'); //our drawing canvas
var grid1 ;
var fontPointSize = 18; //point size for word text
var wordHeight = 20; //estimated height of a string in the editor
var editorFont = 'Arial'; //font for your editor
var player = {name:"default",
color : '#0000ff'};

var drawCanvas = function(){

    var context = canvas.getContext('2d');
	
	var activeColor = player.color;
 	var grid = new CanvasGrid (canvas,{
    	borderColor: '#777'
	});

	grid.drawMatrix({
	  x: 16,
	  y: 4
	});
	 
	canvas.addEventListener('click', function(ev) {
	  if (ev.gridInfo.color === '#000000') {
	    grid.fillCell(ev.gridInfo.x, ev.gridInfo.y, player.color);
	    updateColor(ev.gridInfo.x, ev.gridInfo.y, player.color);
	  } else {
	    //grid.clearCell(ev.gridInfo.x, ev.gridInfo.y);
	  }
	});
	
	grid1=grid;
}

function handleMouseDown(e){
	
	//get mouse location relative to canvas top left
	var rect = canvas.getBoundingClientRect();
    //var canvasX = e.clientX - rect.left;
    //var canvasY = e.clientY - rect.top;
    var canvasX = e.pageX - rect.left; //use jQuery event object pageX and pageY
    var canvasY = e.pageY - rect.top;
	console.log("mouse down:" + canvasX + ", " + canvasY);

	//console.log(wordBeingMoved.word);
	if(wordBeingMoved != null ){
	   deltaX = wordBeingMoved.x - canvasX; 
	   deltaY = wordBeingMoved.y - canvasY;
	   //attache mouse move and mouse up handlers
	   $("#canvas1").mousemove(handleMouseMove);
	   $("#canvas1").mouseup(handleMouseUp);	   
	}

    // Stop propagation of the event and stop any default 
    //  browser action
    e.stopPropagation();
    e.preventDefault();
	
	drawCanvas();
}
	
function handleMouseMove(e){
	
	console.log("mouse move");
	
	//get mouse location relative to canvas top left
	var rect = canvas.getBoundingClientRect();
    var canvasX = e.pageX - rect.left;
    var canvasY = e.pageY - rect.top;
	
	wordBeingMoved.x = canvasX + deltaX;
	wordBeingMoved.y = canvasY + deltaY;
	
	e.stopPropagation();
	
	drawCanvas();
	}
	
function handleMouseUp(e){

	console.log("mouse up");  		
	e.stopPropagation();
	
	//remove mouse move and mouse up handlers but leave mouse down handler
    $("#canvas1").off("mousemove", handleMouseMove); //remove mouse move handler
    $("#canvas1").off("mouseup", handleMouseUp); //remove mouse up handler
		
	drawCanvas(); //redraw the canvas
	}
	
//JQuery Ready function -called when HTML has been parsed and DOM
//created
//can also be just $(function(){...});
//much JQuery code will go in here because the DOM will have been loaded by the time
//this runs

function pollingTimerHandler(){
	$.get("updateData", function(data, status){
    	console.log("data: " + data);
		console.log("typeof: " + typeof data);
		//var colorData = JSON.parse(data);
		var gridData = data.gridData;
		for(var x=0; x < gridData.length; x++) {
	  		grid1.fillCell(gridData[x].x, gridData[x].y, gridData[x].color);
	    }
    });
}

function updateColor (x, y, color) {
	var dataObj = {x: x, y: y, color: color, player: player};
	var jsonString = JSON.stringify(dataObj);

	$.post("colorData",
	    jsonString, 
		function(data, status){
			console.log("data: " + data);
			console.log("typeof: " + typeof data);
			//var colorData = JSON.parse(data);
			var gridData = data.gridData;
			for(var x=0; x < gridData.length; x++) {
		  		grid1.fillCell(gridData[x].x, gridData[x].y, gridData[x].color);
		    }
		});
}

function rgbToHex(r, g, b){
	if(r > 255 || g > 255 || b > 255)
		throw "Invalid color component";
	return ((r << 16) | (g << 8) | b).toString(16);
}


function CanvasGrid(canvas, borderColor) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');

  this.borderColor = borderColor || '#000000';

  var self = this;
  this.canvas.addEventListener('click', function(ev) {
    var pos = {
        x: ev.offsetX || ev.layerX,
        y: ev.offsetY || ev.layerY
    };

    ev.cursorPos = pos;
    ev.gridInfo = self.lookup(pos);
    var p = this.getContext('2d').getImageData(pos.x,pos.y,1,1).data;
    var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6); //Checking if the color is filled in the spot
    ev.gridInfo.color = hex;
  });
}

CanvasGrid.prototype = {
  lookup: function(pos) {
    // these are zero indexed, since they are most
    // likely representing an array/matrix.
    var x = Math.floor(pos.x / this.cellWidth);
    var y = Math.floor(pos.y / this.cellHeight);
    return {
      x: x,
      y: y,
      dimensions: {
        t: this.cellHeight * y,
        l: this.cellWidth * x,
        w: this.cellWidth,
        h: this.cellHeight
      }
    };
  },

  fillCell: function(x, y, color) {
    this.ctx.fillStyle = color || this.borderColor;
    this.ctx.fillRect(this.cellWidth * x + 1, this.cellHeight * y + 1, this.cellWidth - 1.4, this.cellHeight - 2);
  },

  clearCell: function(x, y) {
    this.ctx.clearRect(this.cellWidth * x + 1, this.cellHeight * y + 1, this.cellWidth - 1.4, this.cellHeight - 2);
  },

  drawMatrix: function(matrix) {
    this.cellWidth = this.canvas.width / matrix.x;
    this.cellHeight = this.canvas.height / matrix.y;

    this.drawTop();

    for(var i=1; i<matrix.y + 1; i++) {
      this.drawRow(this.cellHeight * i, matrix.x, this.cellWidth);
    }
  },

  drawTop: function () {
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.canvas.width, 0);
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke()
  },

  drawRow: function(y, columns, width) {
    // draw horizontal line at bottom of row.
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);

    for(var x=0; x < columns + 1; x++) {
      this.ctx.moveTo(width * x, 0);
      this.ctx.lineTo(width * x, y);
    }

    this.ctx.strokeStyle = "#000";
    this.ctx.stroke()
  }
};


$(document).ready(function(){
	
	//add mouse down listener to our canvas object
	$("#canvas1").mousedown(handleMouseDown);
	//add keyboard handler to document
	//$(document).keydown(handleKeyDown);
	//$(document).keyup(handleKeyUp);
		
	//timer = setInterval(handleTimer, 100); //tenth of second
	pollingTimer = setInterval(pollingTimerHandler, 100);  //quarter of a second
    //timer.clearInterval(); //to stop
	
	drawCanvas();
	$('#my_popup').popup({
		blur : false,
		escape : false,
		autoopen : true,
		closetransitionend: function() {
    		var playerSub = $("input:text").val();
    		var dataObj = {name: playerSub};
			var jsonString = JSON.stringify(dataObj);

    			$.post("createPlayer",
				    jsonString, 
					function(data, status){
						console.log("data: " + data);
						console.log("typeof: " + typeof data);
						//var colorData = JSON.parse(data);
						player = data;
				});
  		}
	});

});

