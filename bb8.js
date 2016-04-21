"use strict";

var sphero = require("sphero");

var bb8 = module.exports = function bb8(id) {

    var _id = id;
    var _droid = null;
    var _navigator = null;
    var _decorator = null;
    var _this = this;

    var _rssiLimit = -40;
    var _rssi = -100;
    var _lastRssi = -100;
    var _lastDirection = 0;
    var _txPowerLevel = 0;
    var _direction = "forward";
    var _isConnected = true;

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

    this.connect = function(callback) {
        if (!_droid) {
            _droid = sphero(_id);
            _navigator = new Navigator(_droid);
            _decorator = new Decorator(_droid);

            _droid.on("ready", function() {
                _rssi = _droid.connection.peripheral.rssi;
                _txPowerLevel = _droid.connection.peripheral.advertisement.txPowerLevel;
                _isConnected = true;
                Logger.log("connected", _rssi, _txPowerLevel);
            });

            //_droid.on("close", function() {
            //    _isConnected = false;
            //    Logger.log("disconnected", _rssi, _txPowerLevel);
            //});
        }

        var _callback = function() {
            _droid.connect(function() {
                _droid.setDefaultSettings();
                _droid.stopOnDisconnect();
                _droid.getPowerState(function(error, data) {
                    Logger.log("Power state", data);
                });

                if (callback) callback();
            });
        }

        if (_isConnected) {
            _this.disconnect(_callback);
        } else {
            _callback();
        }
    }

    this.disconnect = function(callback) {
        _droid.disconnect(function() {
            _isConnected = false;
            if (callback) callback();
        });
    }

    this.startCalibration = function() {
        _decorator.blink({red: 255, green: 255, blue: 0});
        _startMonitorRssi(function(data) {
            Logger.log(data);
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

        _droid.detectCollisions();
        _droid.streamVelocity();
        _droid.stopOnDisconnect();

        //_droid.on("velocity", function(data) {
        //    Logger.log("velocity", data);
        //    _findDirectionToBase();
        //});

        _droid.on("collision", function(data) {
            Logger.log("collision", data);
            _gotoBase();
        });

        _startMonitorRssi(function() {
            _updateColor();

            if (_rssi > _rssiLimit) {
                _gotoBase();
            }
        });

        _findDirectionToBase();
    }

    this.getPosition = function(callback) {
        _droid.readLocator(function(error, data){
            Logger.log(data);
            if (callback) callback();
        });
    }

    var _startMonitorRssi = function(callback) {
        _stopMonitorRssi();
        _rssiScanInterval = setInterval(function(){
            _droid.connection.peripheral.updateRssi(function(error, rssi){
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

    var _findDirectionToBase = function() {
        _cancelNavigation();

        _chooseDirectionTimeout = setTimeout(function(){
            _gotoBase();
        }, CHOOSE_DIRECTION_TIMEOUT);
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

    this.cancelNavigation = function() {
        _cancelNavigation();
        _decorator.fade({red: 0, green: 0, blue: 0});
        Logger.log("Stopped!");
    }

    var _completeNavigation = function() {
        _decorator.blink({ red: 0, green: 0, blue: 255});
        Logger.log("Arrived!");
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

        Logger.log("_gotoBase: direction="+_direction+" angle="+angle+" "+logMessage);

        _navigator.move(range, speed, angle, _findDirectionToBase);
        _lastDirection = angle;
    }

    function Navigator(droid) {
        var _droid = droid;
        var _timeout = null;
        var _this = this;

        var _heading = 0;
        var _speed = 0;

        var _clearTimeout = function() {
            if (_timeout) {
                clearTimeout(_timeout);
                _timeout = null;
            }
        }

        this.move = function(range, speed, angle, callback) {
            _clearTimeout();

            var time = Math.round(1000*range/speed);

            _heading = (angle < 0) ? 360+angle : angle;
            _heading = _heading%360;
            _speed = speed;

            Logger.log(Logger.getTime() + " move range="+range+" heading="+_heading+" speed="+speed+" time="+time);

            _droid.roll(speed, _heading, function() {
                _timeout = setTimeout(function() {
                    _this.stop(callback);
                }, time);
            });
        }

        var onStop = function(callback) {
            _droid.setHeading(_heading, function() {
                if (callback) callback();
            });
        }

        this.stop = function(callback) {
            onStop(callback);
        }
    }

    function Decorator(droid) {
        var _droid = droid;
        var _fadeInterval = null;
        var _blinkInterval = null;
        var _currentColor = { red: 0, green: 0, blue: 0 };
        var _this = this;

        var FADE_INTERVAL = 250;
        var BLINK_INTERVAL = 1000;

        var _stopFade = function() {
            if (_fadeInterval) {
                clearInterval(_fadeInterval);
                _fadeInterval = null;
            }
        }

        this.stopBlink = function() {
            if (_blinkInterval) {
                clearInterval(_blinkInterval);
                _blinkInterval = null;
            }
        }

        var _incrementColor = function(step, from, to) {
            var result = 0;
            if ((step > 0 && (from + step) < to) || (step < 0 && (from + step) > to)) {
                result = from + step;
            } else {
                result = to;
            }

            return result;
        }

        var _isSameColor = function(from, to) {
            return from.red == to.red && from.green == to.green && from.blue == to.blue;
        }

        var _calculateFadeStep = function(colorFrom, colorTo, steps) {
            return Math.ceil((colorTo - colorFrom)/steps);
        }

        this.setColor = function(colorTo, fade) {
            if (fade) {
                _this.fadeTo(colorTo);
            } else {
                _stopFade();

                Logger.log("setColor", colorTo);
                _currentColor = colorTo;
                _droid.color(colorTo);
            }
        }

        this.fadeTo = function(colorTo, time) {
            _stopFade();

            if (_isSameColor(_currentColor, colorTo)) {
                return;
            }

            var t = (time) ? time : 1000;
            var dT = FADE_INTERVAL;
            var steps = t/dT;

            var rStep = _calculateFadeStep(_currentColor.red, colorTo.red, steps);
            var gStep = _calculateFadeStep(_currentColor.green, colorTo.green, steps);
            var bStep = _calculateFadeStep(_currentColor.blue, colorTo.blue, steps);

            _fadeInterval = setInterval(function(){
                if (_isSameColor(_currentColor, colorTo)) {
                    _stopFade();
                } else {
                    var _colorTo = {};
                    _colorTo.red = _incrementColor(rStep, _currentColor.red, colorTo.red);
                    _colorTo.green = _incrementColor(gStep, _currentColor.green, colorTo.green);
                    _colorTo.blue = _incrementColor(bStep, _currentColor.blue, colorTo.blue);
                    _currentColor = _colorTo;
                    _droid.color(_colorTo);
                    //Logger.log("fadeTo", _currentColor, colorTo, rStep, gStep, bStep);
                }
            }, dT);
        }

        this.blink = function(color) {
            _this.stopBlink();

            var fadeToBlack = false;

            _blinkInterval = setInterval(function() {
                if (!fadeToBlack) {
                    _this.fadeTo(color);
                } else {
                    _this.fadeTo({red: 0, green: 0, blue: 0});
                }
                fadeToBlack = !fadeToBlack;
            }, BLINK_INTERVAL);
        }

        this.glow = function() {
            _stopFade();
            _this.stopBlink();

            var r = 0;
            var g = 0;
            var b = 0;
            var value = 0;
            var d = 25;

            _fadeInterval = setInterval(function() {
                if (b+d <= 255) {
                    b += d;
                } else {
                    b = 0;
                    if (g+d <= 255) {
                        g += d;
                    } else {
                        g = 0;
                        if (r+d <= 255) {
                            r += d;
                        } else {
                            r = 0;
                        }
                    }
                }

                Logger.log(r, g, b);
                _droid.color({ red: r, green: g, blue: b });
            }, FADE_INTERVAL);
        }
    }


    var Logger = {};
    Logger.startTime = (new Date()).getTime();
    Logger.getTime = function() {
        return (new Date()).getTime() - Logger.startTime;
    }
    Logger.log = function() {
        //arguments.unshift(Logger.getTime());
        //arguments.push(Logger.getTime());
        var _arguments = new Array();
        _arguments.push(Logger.getTime());

        for (var i=0; i<arguments.length; i++) {
            _arguments.push(arguments[i]);
        }

        console.log.apply(console, _arguments);
        //console.log(arguments);
    }
}

/*
var droid = new bb8("56504b4b3f714fa198d1f9a5f0349dfe");
droid.connect(function() {
    //droid.startCalibration();
    //setTimeout(function() {
    //    droid.completeCalibration();
    //}, 10000);
    //droid.getPosition();
    //droid.disconnect();
    droid.startNavigation();
});
    */