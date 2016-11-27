/**
 * Created by davdeev on 4/21/16.
 */

var express = require("express");
var router = express.Router();
var Droid = require("../libs/bb8/Droid.js");
var droid = null;
var noble = require("noble");
var btDevices = {};

noble.on("stateChange", function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    btDevices[peripheral.uuid] = peripheral;
});

router.get('/connect', function(request, response, next) {
    noble.stopScanning();

    var deviceId = request.param("deviceId");

    if (droid != null && droid.getId() != deviceId) {
        droid.disconnect();
        droid = null;
    }

    if (droid == null) {
        droid = new Droid(btDevices[deviceId]);
    }

    droid.connect(function () {
        response.json({
            rssi: droid.getSensors().getRssi(),
            txPowerLevel: droid.getSensors().getTxPowerLevel(),
            rssiLimit: droid.getBrain().getSkills().FIND_SIGNAL.getRssiLimit()
        });
    });
});

router.get('/disconnect', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.disconnect(function () {
            response.json({status: "disconnected"});
        });
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/startCalibration', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.getBrain().getSkills().FIND_SIGNAL.startCalibration(function() {
            response.json({status: "started"});
        });
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/completeCalibration', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.getBrain().getSkills().FIND_SIGNAL.completeCalibration(function() {
            response.json({rssi: droid.getSensors().getRssi(), txPowerLevel: droid.getSensors().getTxPowerLevel(), rssiLimit: droid.getSensors().getRssiLimit()});
        });

    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/goHome', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.getBrain().getSkills().FIND_SIGNAL.goHome(function(_points){
            response.json({points: _points});
        });
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/move', function(request, response) {
    var deviceId = request.param("deviceId");
    var range = request.param("range");
    var speed = request.param("speed");
    var angle = request.param("angle");

    if (droid && droid.getId() == deviceId) {
        droid.getBrain().getSkills().FIND_SIGNAL.move(range, speed, angle, function(_points) {
            response.json({points: _points});
        });
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/getRssi', function(request, response) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        response.json({rssi: droid.getSensors().getRssi(), txPowerLevel: droid.getSensors().getTxPowerLevel(), rssiLimit: droid.getSensors().getRssiLimit(), powerState: droid.getSensors().getPowerState()});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/discoverDevices', function(request, response) {
    var devices = new Array();

    for (var uuid in btDevices) {
        var btDevice = btDevices[uuid];
        devices.push({
            uuid: btDevice.uuid,
            rssi: btDevice.rssi,
            name: btDevice.advertisement.localName,
            txPowerLevel: btDevice.advertisement.txPowerLevel
        });
    }
    response.json(devices);
});

router.get('/getPoints', function(request, response) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        response.json({points: droid.getBrain().getSkills().FIND_SIGNAL.getPoints()});
    } else {
        response.status(404).json({status: "error"});
    }
});

module.exports = router;
