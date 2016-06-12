/**
 * Created by davdeev on 4/23/16.
 */

var Logger = require("./Logger");

var Navigator = module.exports = function Navigator(sphero) {
    var _sphero = sphero;
    var _timeout = null;
    var _this = this;

    var _heading = 0;
    var _speed = 0;
    var _absoluteAngle = 0;
    var _point = null;
    var _callback = null;
    var _velocity = 0;
    var _streamSamplesPerSecond = 1;
    var isInited = false;
    var _x = 0;
    var _y = 0;

    var _init = function() {
        if (!isInited) {
            _sphero.detectCollisions();
            _sphero.streamVelocity(_streamSamplesPerSecond);
            _sphero.streamOdometer(_streamSamplesPerSecond);
            //_sphero.streamAccelerometer(_streamSamplesPerSecond);

            _sphero.on("collision", function(data) {
                _onCollision();
            });

            _sphero.on("velocity", function(data) {
                _velocity = Math.sqrt(Math.pow(data.xVelocity.value[0],2) + Math.pow(data.yVelocity.value[0],2));

                if (_velocity < 25) {
                    //console.log("velocity", _velocity);
                    //_onCollision();
                }
            });

            _sphero.on("odometer", function(data) {
                _x = data.xOdometer.value[0];
                _y = data.yOdometer.value[0];
                //console.log("odometer", _x, _y);
            });

            //_sphero.on("accelerometer", function(data) {
            //    console.log(data);
            //});

            isInited = true;
        }
    }

    this.move = function(range, speed, angle, callback) {
        _init();
        _clearTimeout();

        range = parseInt(range);
        speed = parseInt(speed);
        angle = parseInt(angle);

        var time = Math.round(1000*range/speed);

        _callback = callback;
        _heading = _normalizeAngle(angle);
        _speed = speed;
        _absoluteAngle = _normalizeAngle(_absoluteAngle + _heading);

        Logger.log(Logger.getTime() + " move range="+range+" heading="+_heading+" speed="+speed+" time="+time);

        _point = {
            speed: _speed,
            range: range,
            absoluteAngle: _absoluteAngle,
            estimatedTime: time,
            timeStart: (new Date()).getTime()
        };

        _sphero.roll(speed, _heading, function() {
            _timeout = setTimeout(function() {
                _stop(callback);
                _callback = null;
            }, time);
        });
    }

    var _stop = function(callback) {
        _clearTimeout();

        //_sphero.streamVelocity(_streamSamplesPerSecond, false);
        //_sphero.streamOdometer(_streamSamplesPerSecond, false);
        //_sphero.streamAccelerometer(_streamSamplesPerSecond, true);

        _sphero.stop(function() {
            _onStop(callback);
        });
    }

    var _onStop = function(callback) {
        _sphero.setHeading(_heading, function() {
            _point.realTime = (new Date()).getTime() - _point.timeStart;
            _point.x = _x;
            _point.y = _y;

            if (callback) callback(_point);
        });
    }

    var _onCollision = function() {
        Logger.log("collision!", _velocity);
        _point.isCollision = true;
        _stop(_callback);
        _callback = null;
    }

    var _clearTimeout = function() {
        if (_timeout) {
            clearTimeout(_timeout);
            _timeout = null;
        }
    }

    var _normalizeAngle = function(angle) {
        angle = (angle < 0) ? 360+angle : angle;
        angle = angle%360;
        return angle;
    }
}
