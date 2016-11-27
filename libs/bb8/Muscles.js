"use strict";

var Logger = require("./Logger");

var Muscles = module.exports = function Muscles(droid) {
    var _droid = droid;
    var _timeout = null;
    var _this = this;
    var _heading = 0;

    this.move = function(range, speed, heading, time, callback) {
        _clearTimeout();
        _heading = heading;

        Logger.log(Logger.getTime() + " move range=" + range + " heading=" + _heading + " speed=" + speed + " time=" + time);

        _droid.getSphero().roll(speed, heading, function() {
            _timeout = setTimeout(function() {
                _this.stop(callback);
            }, time);
        });
    };

    this.stop = function(callback) {
        _clearTimeout();

        _droid.getSphero().stop(function() {
            _onStop(callback);
        });
    };

    var _onStop = function(callback) {
        _droid.getSphero().setHeading(_heading, function() {
            if (callback) callback();
        });
    };

    var _clearTimeout = function() {
        if (_timeout) {
            clearTimeout(_timeout);
            _timeout = null;
        }
    };
};
