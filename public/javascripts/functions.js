/**
 * Created by davdeev on 4/22/16.
 */
var isConnected = false;

function connect(callback) {
    if (isConnected) {
        if (callback) {
            callback();
        }
        return;
    }

    $.get("/connect/?deviceId="+ $("#deviceId").val(), function( data ) {
        isConnected = true;
        updateConnectedStatus();
        if (callback) {
            callback();
        }
    });
}

function disconnect() {
    if (!isConnected) {
        return;
    }

    $.get( "/disconnect/?deviceId="+ $("#deviceId").val(), function( data ) {
        isConnected = false;
        updateConnectedStatus();
    });
}

var rssiUpdateInterval = null;

function startCalibration() {
    connect(function() {
        $.get( "/startCalibration/?deviceId="+ $("#deviceId").val(), function( data ) {
            if (rssiUpdateInterval) {
                clearInterval(rssiUpdateInterval);
            }
            rssiUpdateInterval = setInterval(function() {
                getRssi(function(rssi){
                    updateRssi(rssi);
                });
            }, 1000)
        });
    });
}

function completeCalibration() {
    if (!isConnected) {
        return;
    }
    if (rssiUpdateInterval) {
        clearInterval(rssiUpdateInterval);
    }
    $.get( "/completeCalibration/?deviceId="+ $("#deviceId").val(), function( data ) {

    });
}

function startNavigation() {
    if (!isConnected) {
        return;
    }

    $.get( "/startNavigation/?deviceId="+ $("#deviceId").val(), function( data ) {

    });
}

function cancelNavigation() {
    if (!isConnected) {
        return;
    }

    $.get( "/cancelNavigation/?deviceId="+ $("#deviceId").val(), function( data ) {

    });
}

function getRssi(callback) {
    if (!isConnected) {
        return;
    }

    $.get( "/getRssi/?deviceId="+ $("#deviceId").val(), function( data ) {
        if (callback) {
            callback(data.rssi);
        }
    });
}

function updateRssi(rssi) {
    $("#rssi .bar").width((100 + rssi)+"%");
    $("#rssi .value").html(rssi);
}

function discoverDevices(callback) {
    $.get( "/discoverDevices", function( devices ) {
        if (callback) {
            callback(devices);
        }
    });
}

function updateDevicesSelect(devices) {
    var select = $("#deviceId");
    console.log(devices);
    $.each(devices, function(index, device) {
        select.append($(new Option(device.name, device.uuid)));
    });
}

function updateConnectedStatus() {
    $("#deviceStatus").val(isConnected ? "Connected" : "Disconnected");
}

$(document).ready(function() {
    updateConnectedStatus();
    discoverDevices(function(devices) {
        updateDevicesSelect(devices);
        draw();
    });
});

function draw() {
    // Get a reference to the canvas object
    var canvas = document.getElementById('canvas');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([ 200, -50 ]));
    // Draw the view now:
    paper.view.draw();
}