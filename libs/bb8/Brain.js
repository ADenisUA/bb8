"use strict";

var Logger = require("./Logger");
var Сerebellum = require("./Сerebellum");

var Brain = module.exports = function Brain(droid) {
    var _this = this;
    var _droid = droid;
    var _cerebellum = new Сerebellum(_droid);

    var _rssiLimit = -45;
    var _angle = 0;
    var _lastAngle = 0;
    var _lastStartRssi = 0;

    var _direction = "forward";
    var _points = new Array();
    var _point = {};
    var _lastPoint = {};
    var _rssi = -100;

    var RSSI_SENSITIVITY = 2;
    var MIN_RANGE = 150;
    var MAX_RANGE = 750;
    var MIN_SPEED = 75;
    var MAX_SPEED = 250;
    var RSSI_A = 0.8;
    //var MOVE_TIME = 3;//sec

    function _init() {
        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.CONNECTED:

                    break;
                case _droid.STATE.DISCONNECTED:
                    _completeNavigation();
                    break;
            }
        });
        _droid.getSensors().getNotifier().addListener(_droid.getSensors().EVENT.RSSI_CHANGED, function(rssi) {
            _rssi = rssi;
        });
    }

    this.goHome = function(callback) {

        _droid.getSensors().startMonitorRssi();

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

            _calculateAngleAndDirection(_getDrssi(_rssi, _lastStartRssi));
            _updateColor();

            if (callback) callback(points);
        });
    };

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
    };

    this.move = function(range, speed, angle, callback) {
        _lastStartRssi = _rssi;
        _lastAngle = angle;

        _cerebellum.move(range, speed, angle, function(point) {
            point.lastRssi = _lastStartRssi;
            point.rssi = _rssi;
            point.powerState = _droid.getSensors().getPowerState();
            _points.push(point);
            _lastPoint = point;

            if (callback) callback(_points);
        });
    };

    var _completeNavigation = function(callback) {
        //_decorator.blink(COLOR_ARRIVED);

        if (callback) callback(_navigator.getPoints());

        Logger.log("Arrived!");
    };

    this.getPoints = function() {
        return _points;
    };


    this.startCalibration = function(callback) {
        //_decorator.blink(COLOR_CALIBRATING);
        if (!_isMonitoringRssi()) {
            _startMonitorRssi();
            if (callback) callback();
        }
    };

    this.completeCalibration = function(callback) {
        _stopMonitorRssi();
        _rssiLimit = _rssi;
        //_decorator.blink(COLOR_CALIBRATED);
        if (callback) callback();
    };

    var _getDrssi = function(x, y) {
        return x - y;
    }


    this.getRssiLimit = function() {
        return _rssiLimit;
    };
};