"use strict";

var Logger = require("./../utils/Logger");
var Notifier = require("./../utils/Notifier");

var Sensors = module.exports = function Sensors(droid) {
    var _droid = droid;
    var _this = this;

    var COLLISION_MAGNITUDE_SENSITIVITY = 30;
    var COLLISION_RANGE_SENSITIVITY = 5;
    var SCAN_RSSI_TIMEOUT = 1000;

    var _rssiScanInterval = null;
    var _rssi = 0;
    var _powerState = "";
    var _txPowerLevel = 0;
    var _streamSamplesPerSecond = 2;
    // var _velocity = 0;
    // var _acceleration = 0;
    var _point = {"x": 0, "y": 0};
    var RSSI_A = 0.8;

    this.EVENT = {"COLLISION": "COLLISION", "RSSI_CHANGED": "RSSI_CHANGED", "POWER_CHANGED": "POWER_CHANGED", "MOVE": "MOVE"};

    var _notifier = new Notifier();

    function _init() {
        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.CONNECTED:
                    _rssi = _droid.getSphero().connection.peripheral.rssi;
                    _txPowerLevel = _droid.getSphero().connection.peripheral.advertisement.txPowerLevel;

                    Logger.log("connected", _rssi, _txPowerLevel);

                    _startMonitorPower();
                    _startMonitorCollisions();
                    _startMonitorOdometer();

                    // var opts = {
                    //     flags: 0x01,
                    //     x: 0x0000,
                    //     y: 0x0000,
                    //     yawTare: 0x0
                    // };
                    //
                    // _droid.getSphero().configureLocator(opts);

                    _notifier.fireEvent(_this.EVENT.RSSI_CHANGED, _rssi);
                    break;
                case _droid.STATE.DISCONNECTED:
                    this.stopMonitorRssi();
                    _stopMonitorPower();
                    break;
            }
        })
    }

    this.startMonitorRssi = function(callback) {
        _this.stopMonitorRssi();
        _rssiScanInterval = setInterval(function(){
            _droid.getSphero().connection.peripheral.updateRssi(function(error, rssi){
                _rssi = (_rssi == 0) ? rssi : _rssi;
                _rssi = Math.round(RSSI_A*_rssi + (1-RSSI_A)*rssi);

                _notifier.fireEvent(_this.EVENT.RSSI_CHANGED, _rssi);
            })}, SCAN_RSSI_TIMEOUT);
    };

    this.stopMonitorRssi = function() {
        if (_rssiScanInterval != null) {
            clearInterval(_rssiScanInterval);
            _rssiScanInterval = null;
        }
    };

    var _startMonitorCollisions = function() {
        /*
         xt: 0x20,
         yt: 0x20,
         xs: 0x10,
         ys: 0x10,
         dead: 0x01
         */
        _droid.getSphero().detectCollisions({
            device: "bb8"
        });

        _droid.getSphero().on("collision", function(data) {
            var magnitude = Math.sqrt(data.xMagnitude*data.yMagnitude);
            Logger.log("collision! magnitude="
                + magnitude
                + " xmagnitude="
                + data.xMagnitude
                + " ymagnitude="
                + data.yMagnitude
                + " speed="
                + data.speed);

            if (magnitude > COLLISION_MAGNITUDE_SENSITIVITY) {
                Logger.log("collision fired");
                _this.getPoint(function(point) {
                    _notifier.fireEvent(_this.EVENT.COLLISION, point);
                });
            }
        });
    };

    var _startMonitorOdometer = function() {

        _droid.getSphero().streamOdometer(_streamSamplesPerSecond);

        _droid.getSphero().on("dataStreaming", function(data) {
            _point = {"x": data.xOdometer.value[0], "y": data.yOdometer.value[0]};
            //_notifier.fireEvent(_this.EVENT.MOVE, _point);

            //_velocity = Math.round(Math.sqrt(Math.pow(data.xVelocity.value[0],2) + Math.pow(data.yVelocity.value[0],2)));
            //_acceleration = Math.sqrt(Math.pow(data.xAccel.value[0],2) + Math.pow(data.yAccel.value[0],2) + Math.pow(data.zAccel.value[0],2));
            //Logger.log(_x, _y, _velocity, data.xAccel.value[0], data.yAccel.value[0], data.zAccel.value[0]);
        });

        //_droid.getSphero().streamAccelerometer(_streamSamplesPerSecond);

        //_droid.getSphero().on("velocity", function(data) {
        //    _velocity = Math.sqrt(Math.pow(data.xVelocity.value[0],2) + Math.pow(data.yVelocity.value[0],2));
        //
        //    if (_velocity < 25) {
        //        //console.log("velocity", _velocity);
        //        //_onCollision();
        //    }
        //});
        //
        //_droid.getSphero().on("odometer", function(data) {
        //    _x = data.xOdometer.value[0];
        //    _y = data.yOdometer.value[0];
        //    //console.log("odometer", _x, _y);
        //});

        //_droid.getSphero().streamVelocity(_streamSamplesPerSecond);

        //_droid.getSphero().on("accelerometer", function(data) {
        //    console.log(data);
        //});
    }

    var _startMonitorPower = function() {
        _droid.getSphero().setPowerNotification(1, function(error, data) {
            _droid.getSphero().getPowerState(function(error, data) {
                if (data) {
                    _powerState = data.batteryState;
                    _notifier.fireEvent(_this.EVENT.POWER_CHANGED, _powerState);
                }
            });
        });
    };

    this.getTxPowerLevel = function() {
        return _txPowerLevel;
    };

    this.getRssi = function() {
        return _rssi;
    };

    this.getPowerState = function() {
        return _powerState;
    };

    this.getPoint = function(callback) {
        // _droid.getSphero().readLocator(function(error, data) {
        //     var point = null;
        //
        //     if (data) {
        //         point = {"x": data.xpos, "y": data.ypos};
        //     }
        //
        //     if (callback) callback(point);
        // });

        if (callback) callback(_point);
    };

    this.getNotifier = function () {return _notifier};

    _init();
};