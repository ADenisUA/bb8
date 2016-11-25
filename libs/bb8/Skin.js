"use strict";

var Logger = require("./Logger");
var Pigment = require("./Pigment");

var Skin = module.exports = function Skin(droid) {
    var _droid = droid;
    var _pigment = new Pigment(_droid);

    //colors
    var COLOR_CALIBRATING = {red: 255, green: 255, blue: 0};
    var COLOR_WAITING = {red: 0, green: 0, blue: 0};
    var COLOR_CALIBRATED = {red: 0, green: 255, blue: 0};
    var COLOR_ARRIVED = { red: 0, green: 0, blue: 255};
    var MINIMUM_INTENSITY = 55;

    function _init() {
        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.SEARCHING:
                    _stateSearching();
                    break;
                case _droid.STATE.READY:
                case _droid.STATE.CONNECTED:
                    break;
            }
        });
    }

    var _stateSearching = function() {
        var fade = true;
        var intensity = MINIMUM_INTENSITY + Math.round((255 - MINIMUM_INTENSITY) * _rssiLimit / _rssi);
        intensity = (intensity > 255) ? 255 : intensity;

        //Logger.log("_updateColor", intensity, _direction);

        if (_direction == "forward") {
            _pigment.setColor({ red: 0, green: intensity, blue: 0 }, fade);
        } else if (_direction == "backward") {
            _pigment.setColor({ red: intensity, green: 0, blue: 0 }, fade);
        } else if (_direction == "left") {
            _pigment.setColor({ red: intensity, green: intensity, blue: 0 }, fade);
        } else if (_direction == "right") {
            _pigment.setColor({ red: 0, green: 0, blue: intensity }, fade);
        }
    }

    _init();
}