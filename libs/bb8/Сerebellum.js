"use strict";

var Logger = require("./Logger");
var Notifier = require("./Notifier");

var Сerebellum = module.exports = function Сerebellum(droid) {
    var _droid = droid;
    var _this = this;

    var _point = {};
    var _absoluteAngle = 0;
    var _callback = null;

    var _init = function() {
        _droid.getSensors().getNotifier().addListener(_droid.EVENT.COLLISION, function(point) {
            _droid.getMuscles().stop(function () {
                if (_callback != null) {
                    point = _droid.getSensors().getPoint();

                    _point.x = point.x;
                    _point.y = point.y;
                    _point.isCollision = true;

                    _callback(_point);
                    _callback = null;
                }
            });
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

        Logger.log(Logger.getTime() + " move range=" + range + " heading=" + _heading + " speed=" + speed + " time=" + time);

        _point = {
            speed: speed,
            range: range,
            absoluteAngle: _absoluteAngle,
            estimatedTime: time,
            timeStart: (new Date()).getTime(),
            isCollision: false
        };

        var point = _droid.getSensors().getPoint();
        _point.startX = point.x;
        _point.startY = point.y;

        _droid.getMuscles().move(range, speed, heading, function() {
            if (_callback != null) {
                _callback(_point);
                _callback = null;
            }
        });
    };

    var _normalizeAngle = function(angle) {
        angle = (angle < 0) ? 360+angle : angle;
        angle = angle%360;
        return angle;
    };
};
