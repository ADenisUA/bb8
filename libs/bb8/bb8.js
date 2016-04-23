"use strict";

var sphero = require("sphero");
var Logger = require("./Logger");
var Decorator = require("./Decorator");
var Navigator = require("./Navigator");

var bb8 = module.exports = function bb8(device) {

    var _id = (typeof(device) != "String") ? device.uuid : device;
    var _sphero = null;
    var _navigator = null;
    var _decorator = null;
    var _this = this;
    var _device = (typeof(device) == "String") ? null : device;

    var _rssiLimit = -40;
    var _rssi = -100;
    var _lastRssi = -100;
    var _lastDirection = 0;
    var _txPowerLevel = 0;
    var _direction = "forward";
    var _isConnected = false;
    var _points = new Array();
    var _continueNavigation = false;

    var _rssiScanInterval = null;
    var _chooseDirectionTimeout = null;

    var SCAN_RSSI_TIMEOUT = 500;
    var RSSI_SENSITIVITY = 2;
    var MIN_RANGE = 75;
    var MAX_RANGE = 500;
    var MIN_SPEED = 35;
    var MAX_SPEED = 200;
    var CHOOSE_DIRECTION_TIMEOUT = 500;
    var RSSI_A = 0.8;
    var MOVE_TIME = 3;//sec

    this.getId = function() {
        return _id;
    }

    this.getRssi = function() {
        return _rssi;
    }

    this.getRssiLimit = function() {
        return _rssiLimit;
    }

    this.getTxPowerLevel = function() {
        return _txPowerLevel;
    }

    this.getSphero = function() {
        return _sphero;
    }

    this.connect = function(callback) {
        if (!_sphero) {
            _sphero = sphero(_id, {peripheral: _device});
            _navigator = new Navigator(_sphero);
            _decorator = new Decorator(_sphero);

            _sphero.on("ready", function() {
                _rssi = _sphero.connection.peripheral.rssi;
                _txPowerLevel = _sphero.connection.peripheral.advertisement.txPowerLevel;
                _isConnected = true;
                Logger.log("connected", _rssi, _txPowerLevel);
            });
        }

        var _callback = function() {
            _sphero.connect(function() {
                _sphero.setDefaultSettings();
                _sphero.stopOnDisconnect();
                _sphero.getPowerState(function(error, data) {
                    //Logger.log("Power state", data);
                });

                if (callback) callback();
            });
        }

        if (_isConnected) {
            if (callback) callback();
        } else {
            _callback();
        }
    }

    this.disconnect = function(callback) {
        _sphero.disconnect(function() {
            _isConnected = false;
            if (callback) callback();
        });
    }

    this.startCalibration = function() {
        _decorator.blink({red: 255, green: 255, blue: 0});
        _startMonitorRssi(function(data) {
            //Logger.log(data);
        });
    }

    this.cancelCalibration = function() {
        _stopMonitorRssi();
        _decorator.stopBlink();
        _decorator.fadeTo({red: 0, green: 0, blue: 0});
    }

    this.completeCalibration = function() {
        _stopMonitorRssi();
        _rssiLimit = _rssi;
        _decorator.blink({red: 0, green: 255, blue: 0});
    }

    this.startNavigation = function() {
        _cancelNavigation();
        _continueNavigation = true;

        _sphero.stopOnDisconnect();

        _startMonitorRssi(function() {
            _updateColor();

            if (_rssi > _rssiLimit) {
                _gotoBase();
            }
        });

        _findDirectionToBase();
    }

    this.cancelNavigation = function() {
        _cancelNavigation();
        _continueNavigation = false;
        _decorator.fadeTo({red: 0, green: 0, blue: 0}, 1000);
        Logger.log("Stopped!");
    }

    this.getPosition = function(callback) {
        _sphero.readLocator(function(error, data){
            Logger.log(data);
            if (callback) callback();
        });
    }

    var _startMonitorRssi = function(callback) {
        _stopMonitorRssi();
        _rssiScanInterval = setInterval(function(){
            _sphero.connection.peripheral.updateRssi(function(error, rssi){
                _rssi = (_rssi == 0) ? rssi : _rssi;
                _lastRssi = (_lastRssi == 0) ? _rssi : _lastRssi;
                _rssi = Math.round(RSSI_A*_rssi + (1-RSSI_A)*rssi);

                if (callback) callback({rssi: _rssi, lastRssi: _lastRssi, rawRssi: rssi});
            })}, SCAN_RSSI_TIMEOUT);
    }

    var _stopMonitorRssi = function() {
        if (_rssiScanInterval) {
            clearInterval(_rssiScanInterval);
            _rssiScanInterval = null;
        }
    }

    var _getDrssi = function(x, y) {
        return x - y;
    }

    var _cancelNavigation = function() {
        if (_chooseDirectionTimeout) {
            clearTimeout(_chooseDirectionTimeout);
        }
    }

    var _completeNavigation = function() {
        _continueNavigation = false;
        _cancelNavigation();
        _decorator.blink({ red: 0, green: 0, blue: 255});
        Logger.log("Arrived!");
    }

    var _findDirectionToBase = function() {
        if (!_continueNavigation) {
            return;
        }

        _cancelNavigation();

        _chooseDirectionTimeout = setTimeout(function(){
            _gotoBase();
        }, CHOOSE_DIRECTION_TIMEOUT);
    }

    var _gotoBase = function() {
        if (_rssi >= _rssiLimit) {
            _completeNavigation();
            return;
        }

        var dRssi = _getDrssi(_rssi, _lastRssi);
        var logMessage = "rssi = " + _rssi + " lastRssi=" + _lastRssi + " dRssi=" + dRssi;

        _lastRssi = _rssi;
        var angle = 0;
        var time = MOVE_TIME;
        //var range = Math.round(Math.abs(_rssi - RSSI_LIMIT)*RSSI_TO_RANGE_RATIO);
        var range = Math.round(Math.pow(_getDrssi(_rssiLimit, _rssi), 2));
        Logger.log(range);
        range = (range<MIN_RANGE) ? MIN_RANGE : range;
        range = (range>MAX_RANGE) ? MAX_RANGE : range;

        var speed = Math.round(range/time);
        speed = (speed<MIN_SPEED)?MIN_SPEED:speed;
        speed = (speed>MAX_SPEED)?MAX_SPEED:speed;

        if (dRssi > RSSI_SENSITIVITY) {
            angle = Math.round(45*Math.random()-22.5);
            _direction = "forward";
        } else if (dRssi < -RSSI_SENSITIVITY) {
            angle = Math.round(180+(90*Math.random()-45));
            _direction = "backward";
        } else {
            var sign = (dRssi >= 0) ? 1 : -1;

            if (Math.random() > 0.5) {
                angle = Math.round(90 - sign*(45 * Math.random()));
                _direction = "right";
            } else {
                angle = Math.round(270 + sign*(45 * Math.random()));
                _direction = "left";
            }
        }

        //Logger.log("_gotoBase: direction="+_direction+" angle="+angle+" "+logMessage);

        _navigator.move(range, speed, angle, function(point) {
            point.rssi = _rssi;
            point.lastRssi = _lastRssi;
            _points.push(point);
            _findDirectionToBase();
        });
        _lastDirection = angle;
    }

    var _updateColor = function() {
        var fade = true;
        var minimumIntensity = 55;
        var intensity = minimumIntensity + Math.round((255 - minimumIntensity) * _rssiLimit / _rssi);
        intensity = (intensity > 255) ? 255 : intensity;

        //Logger.log("_updateColor", intensity, _direction);

        if (_direction == "forward") {
            _decorator.setColor({ red: 0, green: intensity, blue: 0 }, fade);
        } else if (_direction == "backward") {
            _decorator.setColor({ red: intensity, green: 0, blue: 0 }, fade);
        } else if (_direction == "left") {
            _decorator.setColor({ red: intensity, green: intensity, blue: 0 }, fade);
        } else if (_direction == "right") {
            _decorator.setColor({ red: 0, green: 0, blue: intensity }, fade);
        }
    }

    this.getPoints = function() {
        return _points;
    }
}


//var droid = new bb8("56504b4b3f714fa198d1f9a5f0349dfe");
//droid.connect(function() {
//    //droid.startCalibration();
//    //setTimeout(function() {
//    //    droid.completeCalibration();
//    //}, 10000);
//    //droid.getPosition();
//    //droid.disconnect();
//    //droid.startNavigation();
//});
