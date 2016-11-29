"use strict";

var Logger = require("./../utils/Logger");
var Notifier = require("./../utils/Notifier");

var Сerebellum = module.exports = function Сerebellum(droid) {
    var _droid = droid;
    var _this = this;

    var _point = {"x": 0, "y": 0, "speed": 0, "range": 0, "absoluteAngle": 0, "estimatedTime": 0, "timeStart": 0, "isCollision": false, "startX": 0, "startY": 0};
    var _absoluteAngle = 0;
    var _callback = null;

    var _init = function() {
        _droid.getSensors().getNotifier().addListener(_droid.getSensors().EVENT.COLLISION, function(point) {
            _droid.getMuscles().stop(function () {
                if (_callback != null) {
                    //point = _droid.getSensors().getPoint();

                    _point.x = point.x;
                    _point.y = point.y;
                    _point.isCollision = true;

                    Logger.log("oncollision", _point);
                    _callback(_point);
                    _callback = null;
                }
            });
        });
    };

    this.turn = function(angle, callback) {
        angle = parseInt(angle);

        var heading = _normalizeAngle(angle);
        _absoluteAngle = _normalizeAngle(_absoluteAngle + heading);

        _droid.getMuscles().turn(heading, function () {
            if (callback != null) callback();
        });
    };

    this.move = function(range, speed, angle, callback) {
        _callback = callback;

        range = parseInt(range);
        speed = parseInt(speed);
        angle = parseInt(angle);

        var time = Math.round(1000*range/speed);
        var heading = _normalizeAngle(angle);
        _absoluteAngle = _normalizeAngle(_absoluteAngle + heading);

        _point = {
            speed: speed,
            range: range,
            absoluteAngle: _absoluteAngle,
            estimatedTime: time,
            timeStart: (new Date()).getTime(),
            isCollision: false
        };

        _droid.getSensors().getPoint(function (point) {
            _point.startX = point.x;
            _point.startY = point.y;

            _droid.getMuscles().move(range, speed, heading, time, function() {
                if (_callback != null) {
                    var point = _droid.getSensors().getPoint(function (point) {
                        _point.x = point.x;
                        _point.y = point.y;

                        Logger.log("onmove", _point);
                        _callback(_point);
                        _callback = null;
                    });
                }
            });
        });

    };

    var _normalizeAngle = function(angle) {
        angle = (angle < 0) ? 360+angle : angle;
        angle = angle%360;
        return angle;
    };
};
