/**
 * Created by davdeev on 4/21/16.
 */

var express = require("express");
var router = express.Router();
var bb8 = require("../libs/bb8/bb8.js");
var droid = null;
var noble = require("noble");
var peripherals = {};

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    peripherals[peripheral.uuid] = peripheral;

});

router.get('/connect', function(request, response, next) {
    noble.stopScanning();

    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.disconnect();
    }

    droid = new bb8(peripherals[deviceId]);

    droid.connect(function () {
        response.json({status: "connected"});
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
        droid.startCalibration();
        response.json({status: "started"});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/completeCalibration', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.completeCalibration();
        response.json({status: "completed"});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/startNavigation', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.startNavigation();
        response.json({status: "completed"});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/cancelNavigation', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        droid.cancelNavigation();
        response.json({status: "completed"});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/getRssi', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        response.json({rssi: droid.getRssi(), txPowerLevel: droid.getTxPowerLevel(), rssiLimit: droid.getRssiLimit()});
    } else {
        response.status(404).json({status: "error"});
    }
});

router.get('/discoverDevices', function(request, response, next) {
    var devices = new Array();

    for (var uuid in peripherals) {
        var peripheral = peripherals[uuid];
        devices.push({
            uuid: peripheral.uuid,
            rssi: peripheral.rssi,
            name: peripheral.advertisement.localName,
            txPowerLevel: peripheral.advertisement.txPowerLevel
        });
    }
    response.json(devices);
});

router.get('/getPoints', function(request, response, next) {
    var deviceId = request.param("deviceId");

    if (droid && droid.getId() == deviceId) {
        response.json({points: droid.getPoints()});
    } else {
        response.status(404).json({status: "error"});
    }
});

module.exports = router;
