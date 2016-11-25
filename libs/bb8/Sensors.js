"use strict";

var Logger = require("./Logger");
var Notifier = require("./Notifier");

var Sensors = module.exports = function Sensors(droid) {
    var _droid = droid;
    var _this = this;

    var SCAN_POWER_STATE_TIMEOUT = 10000;
    var COLLISION_MAGNITUDE_SENSITIVITY = 30;
    var COLLISION_RANGE_SENSITIVITY = 5;
    var SCAN_RSSI_TIMEOUT = 1000;

    var _rssiScanInterval = null;
    var _powerStateScanInterval = null;
    var _rssi = -100;
    var _powerState = null;
    var _txPowerLevel = 0;
    var _streamSamplesPerSecond = 2;
    var _velocity = 0;
    var _acceleration = 0;
    var _point = {"x": 0, "y": 0};

    this.EVENT = {"COLLISION": "COLLISION", "RSSI_CHANGED": "RSSI_CHANGED", "POWER_CHANGED": "POWER_CHANGED"};

    var _notifier = new Notifier();
    this.getNotifier = function () {return _notifier};

    function _init() {
        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.CONNECTED:
                    _rssi = _droid.getSphero().connection.peripheral.rssi;
                    _txPowerLevel = _droid.getSphero().connection.peripheral.advertisement.txPowerLevel;

                    Logger.log("connected", _rssi, _txPowerLevel);

                    _startMonitorPower();

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

                        if (magnitude > COLLISION_MAGNITUDE_SENSITIVITY) {
                            Logger.log("collision! magnitude="
                                + magnitude
                                + " xmagnitude="
                                + data.xMagnitude
                                + " ymagnitude="
                                + data.yMagnitude
                                + " speed="
                                + data.speed);
                            _notifier.fireEvent(_this.EVENT.COLLISION, _point);
                        }
                    });

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

                    _droid.getSphero().streamVelocity(_streamSamplesPerSecond);
                    _droid.getSphero().streamOdometer(_streamSamplesPerSecond);
                    _droid.getSphero().streamAccelerometer(_streamSamplesPerSecond);

                    _droid.getSphero().on("dataStreaming", function(data) {
                        _point.x = data.xOdometer.value[0];
                        _point.y = data.yOdometer.value[0];
                        _velocity = Math.round(Math.sqrt(Math.pow(data.xVelocity.value[0],2) + Math.pow(data.yVelocity.value[0],2)));
                        _acceleration = Math.sqrt(Math.pow(data.xAccel.value[0],2) + Math.pow(data.yAccel.value[0],2) + Math.pow(data.zAccel.value[0],2));
                        //Logger.log(_x, _y, _velocity, data.xAccel.value[0], data.yAccel.value[0], data.zAccel.value[0]);
                    });


                    //_droid.getSphero().on("accelerometer", function(data) {
                    //    console.log(data);
                    //});

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
        if (_isMonitoringRssi()) {
            clearInterval(_rssiScanInterval);
            _rssiScanInterval = null;
        }
    };

    var _startMonitorPower = function(callback) {
        _stopMonitorPower();

        _powerStateScanInterval = setInterval(function () {
            _droid.getSphero().getPowerState(function(error, data) {
                if (data) {
                    _powerState = data.batteryState;
                }
            });
        }, SCAN_POWER_STATE_TIMEOUT)
    };

    var _stopMonitorPower = function(callback) {
        if (_powerStateScanInterval != null) {
            clearInterval(_powerStateScanInterval);
            _powerStateScanInterval = null;
        }
    };

    var _isMonitoringRssi = function() {
        return _rssiScanInterval != null;
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

    this.getPoint = function() {
        return _point;
    }

    _init();
};