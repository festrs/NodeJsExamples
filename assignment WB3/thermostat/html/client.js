var pollingTimer; //timer to poll server for location updates
var temperatureDefault = 23;


function showFurnaceState(state){
	if(state === "ON"){
		$('#myonoffswitch').prop('checked', true);
	}else{	
		$('#myonoffswitch').prop('checked', false);
	}
}

function getWeatherInfo(){
	$.get("/weatherinfo",function(data, status){
    	console.log("data: " + data);
		console.log("typeof: " + typeof data);
		var dataObj = JSON.parse(data);
		$("#weatherinfo").text("Weather info = " + dataObj.name + "\n  Temp = " + (dataObj.main.temp - 273.15));
	    console.log('Raw Response: ' + dataObj);
    });
}

function pollingTimerHandler(){
	var responseData = '';
	var jsonString = JSON.stringify(responseData);
	$.post("/", jsonString ,function(data, status){
    	console.log("data: " + data);
		console.log("typeof: " + typeof data);
		var dataObj = JSON.parse(data);
		$("#temperature").text("Temperature = " + dataObj.temperature);
		$("#temperatureDefault").text("Temperature Default = " + dataObj.temperatureDefault;
		showFurnaceState(dataObj.furnace);
	    console.log('Raw Response: ' + responseData);
	    console.log('TEMP: ' + dataObj.temperature);
	    console.log('FURNACE STATE: ' + dataObj.furnace);
    });
}

function increase(){
	temperatureDefault++;
	$("#temperatureDefault").text("Temperature Default = " + temperatureDefault);
	var responseData = {"temperature" : "increase"};
	var jsonString = JSON.stringify(responseData);
	$.post("/furnacestate", jsonString ,function(data, status){
    	console.log("data: " + data);
		console.log("typeof: " + typeof data);
		var dataObj = JSON.parse(data);
		showFurnaceState(dataObj.furnace);
	    console.log('Raw Response: ' + responseData);
	    console.log('TEMP: ' + dataObj.temperature);
	    console.log('FURNACE STATE: ' + dataObj.furnace);
    });
}

function decrease(){
	temperatureDefault--;
	$("#temperatureDefault").text("Temperature Default = " + temperatureDefault);
	var responseData = {"temperature" : "decrease"};
	var jsonString = JSON.stringify(responseData);
	$.post("/furnacestate", jsonString ,function(data, status){
    	console.log("data: " + data);
		console.log("typeof: " + typeof data);
		var dataObj = JSON.parse(data);
		showFurnaceState(dataObj.furnace);
	    console.log('Raw Response: ' + responseData);
	    console.log('TEMP: ' + dataObj.temperature);
	    console.log('FURNACE STATE: ' + dataObj.furnace);
    });
}

$(document).ready(function(){
	getWeatherInfo();
	$("#temperatureDefault").text("Temperature Default = " + temperatureDefault);
	pollingTimer = setInterval(pollingTimerHandler, 1*1000);
});