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
    var _lastAngle = 0;
    var _txPowerLevel = 0;
    var _direction = "forward";
    var _isConnected = false;
    var _points = new Array();
    var _continueNavigation = false;

    var _rssiScanInterval = null;

    var SCAN_RSSI_TIMEOUT = 750;
    var RSSI_SENSITIVITY = 2;
    var MIN_RANGE = 75;
    var MAX_RANGE = 500;
    var MIN_SPEED = 35;
    var MAX_SPEED = 200;
    var RSSI_A = 0.8;
    var MOVE_TIME = 3;//sec

    //states
    var STATE_NAVIGATING = "STATE_NAVIGATING";
    var STATE_WAITING = "STATE_WAITING";
    var STATE_DISCONNECTED = "STATE_DISCONNECTED";

    var _state = STATE_DISCONNECTED;

    //colors
    var COLOR_CALIBRATING = {red: 255, green: 255, blue: 0};
    var COLOR_WAITING = {red: 0, green: 0, blue: 0};
    var COLOR_CALIBRATED = {red: 0, green: 255, blue: 0};
    var COLOR_ARRIVED = { red: 0, green: 0, blue: 255};

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
                _sphero.stopOnDisconnect();

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
        _decorator.blink(COLOR_CALIBRATING);
        _startMonitorRssi(function(data) {
            //Logger.log(data);
        });
    }

    this.completeCalibration = function() {
        _stopMonitorRssi();
        _rssiLimit = _rssi;
        _decorator.blink(COLOR_CALIBRATED);
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

    var _isMonitoringRssi = function() {
        return _rssiScanInterval == null;
    }

    var _stopMonitorRssi = function() {
        if (_isMonitoringRssi()) {
            clearInterval(_rssiScanInterval);
            _rssiScanInterval = null;
        }
    }

    var _getDrssi = function(x, y) {
        return x - y;
    }

    var _completeNavigation = function() {
        _continueNavigation = false;
        _cancelNavigation();
        _decorator.blink(COLOR_ARRIVED);

        Logger.log("Arrived!");
    }

    this.gotToBase = function(callback) {
        if (!_isMonitoringRssi()) {
            _startMonitorRssi();
        }

        if (_rssi >= _rssiLimit) {
            _completeNavigation();
            return;
        }

        var dRssi = _getDrssi(_rssi, _lastRssi);

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

        this.move(range, speed, angle, function(points) {
            _decorator.fadeTo(COLOR_WAITING);
            _updateColor();
            if (callback) callback(points);
        });
    }


    this.move = function(range, speed, angle, callback) {
        _navigator.move(range, speed, angle, function(point) {
            point.rssi = _rssi;
            point.lastRssi = _lastRssi;
            _points.push(point);
            if (callback) callback(_points);
        });
        _lastAngle = angle;
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