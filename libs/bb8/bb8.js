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

    var _rssiLimit = -45;
    var _rssi = -100;
    var _lastStartRssi = 0;
    var _powerState = null;
    var _angle = 0;
    var _lastAngle = 0;
    var _txPowerLevel = 0;
    var _direction = "forward";
    var _isConnected = false;
    var _points = new Array();
    var _lastPoint = null;

    var _rssiScanInterval = null;
    var _powerStateScanInterval = null;

    var SCAN_RSSI_TIMEOUT = 500;
    var SCAN_POWER_STATE_TIMEOUT = 10000;
    var RSSI_SENSITIVITY = 2;
    var MIN_RANGE = 150;
    var MAX_RANGE = 750;
    var MIN_SPEED = 75;
    var MAX_SPEED = 250;
    var RSSI_A = 0.8;
    //var MOVE_TIME = 3;//sec
    var MINIMUM_INTENSITY = 55;

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
    };

    this.getRssi = function() {
        return _rssi;
    };

    this.getRssiLimit = function() {
        return _rssiLimit;
    };

    this.getTxPowerLevel = function() {
        return _txPowerLevel;
    };

    this.getSphero = function() {
        return _sphero;
    };

    this.getPowerState = function() {
        return _powerState;
    }

    var _onReady = function(callback) {
        _rssi = _sphero.connection.peripheral.rssi;
        _txPowerLevel = _sphero.connection.peripheral.advertisement.txPowerLevel;
        _isConnected = true;

        _sphero.setDefaultSettings();
        _sphero.stopOnDisconnect();

        _startMonitorPower();

        Logger.log("connected", _rssi, _txPowerLevel);

        if (callback) callback();
    };

    this.connect = function(callback) {
        if (!_sphero) {
            _sphero = sphero(_id, {peripheral: _device});
            _navigator = new Navigator(_sphero);
            _decorator = new Decorator(_sphero);

            _sphero.on("ready", function() {
                _onReady(callback);
            });

            _sphero.connect(function() {
            });
        } else if (!_isConnected) {
            _onReady(callback);
        }
    }

    this.disconnect = function(callback) {
        _isConnected = false;

        _completeNavigation();
        _stopMonitorRssi();
        _stopMonitorPower();

        if (callback) callback();
    }

    this.startCalibration = function(callback) {
        _decorator.blink(COLOR_CALIBRATING);
        if (!_isMonitoringRssi()) {
            _startMonitorRssi();
            if (callback) callback();
        }
    }

    this.completeCalibration = function(callback) {
        _stopMonitorRssi();
        _rssiLimit = _rssi;
        _decorator.blink(COLOR_CALIBRATED);
        if (callback) callback();
    }

    var _startMonitorRssi = function(callback) {
        _stopMonitorRssi();
        _rssiScanInterval = setInterval(function(){
            _sphero.connection.peripheral.updateRssi(function(error, rssi){
                _rssi = (_rssi == 0) ? rssi : _rssi;
                _rssi = Math.round(RSSI_A*_rssi + (1-RSSI_A)*rssi);

                if (callback) callback({rssi: _rssi, rawRssi: rssi, powerState: _powerState});
            })}, SCAN_RSSI_TIMEOUT);
    }

    var _startMonitorPower = function(callback) {
        _stopMonitorPower();

        _powerStateScanInterval = setInterval(function () {
            _sphero.getPowerState(function(error, data) {
                if (data) {
                    _powerState = data.batteryState;
                }
            });
        }, SCAN_POWER_STATE_TIMEOUT)
    }

    var _stopMonitorPower = function(callback) {
        if (_powerStateScanInterval != null) {
            clearInterval(_powerStateScanInterval);
            _powerStateScanInterval = null;
        }
    }

    var _isMonitoringRssi = function() {
        return _rssiScanInterval != null;
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

    var _completeNavigation = function(callback) {
        _decorator.blink(COLOR_ARRIVED);

        if (callback) callback(_navigator.getPoints());

        Logger.log("Arrived!");
    }

    this.gotToBase = function(callback) {

        if (!_isMonitoringRssi()) {
            _startMonitorRssi();
        }

        if (_lastStartRssi == 0) {
            _lastStartRssi = _rssi;
        }

        if (_rssi >= _rssiLimit) {
            _completeNavigation(callback);
            return;
        }

        var range = MIN_RANGE + _getDrssi(_rssi, _rssiLimit)/_rssi*(MAX_RANGE - MIN_RANGE);

        if (_lastPoint != null && _lastPoint.isCollision) {
            range = MIN_RANGE;
        }

        range = Math.max(MIN_RANGE, range);
        range = Math.min(MAX_RANGE, range);

        var speed = MIN_SPEED + _getDrssi(_rssi, _rssiLimit)/_rssi*(MAX_SPEED - MIN_SPEED);
        speed = Math.max(MIN_SPEED, speed);
        speed = Math.min(MAX_SPEED, speed);

        _calculateAngleAndDirection(_getDrssi(_rssi, _lastStartRssi));
        _updateColor();

        Logger.log("_calculateAngleAndDirection: _direction=" + _direction + " _lastStartRssi=" + _lastStartRssi+" _rssi="+_rssi);

        this.move(range, speed, _angle, function(points) {
            //_decorator.fadeTo(COLOR_WAITING);

            _calculateAngleAndDirection(_getDrssi(_rssi, _lastStartRssi));
            _updateColor();

            if (callback) callback(points);
        });
    }

    var _calculateAngleAndDirection = function(dRssi) {
        var angle = 0;

        if (dRssi < -RSSI_SENSITIVITY || (_lastPoint != null && _lastPoint.isCollision)) {
            angle = Math.round(180+(90*Math.random()-45));
            _direction = "backward";
        } else if (dRssi > RSSI_SENSITIVITY) {
            angle = Math.round(45*Math.random()-22.5);
            _direction = "forward";
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

        _angle = angle;
    }


    this.move = function(range, speed, angle, callback) {
        _lastStartRssi = _rssi;
        _lastAngle = angle;

        _navigator.move(range, speed, angle, function(point) {

            point.lastRssi = _lastStartRssi;
            point.rssi = _rssi;
            _points.push(point);
            _lastPoint = point;

            if (callback) callback(_points);
        });
    }

    var _updateColor = function() {
        var fade = true;

        var intensity = MINIMUM_INTENSITY + Math.round((255 - MINIMUM_INTENSITY) * _rssiLimit / _rssi);
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