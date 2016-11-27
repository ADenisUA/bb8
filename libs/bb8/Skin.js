"use strict";

var Logger = require("./../utils/Logger");
var Pigment = require("./Pigment");

var Skin = module.exports = function Skin(droid) {
    var _this = this;
    var _droid = droid;
    var _pigment = null;

    //colors
    var COLOR_CALIBRATING = {red: 255, green: 255, blue: 0};
    var COLOR_WAITING = {red: 0, green: 0, blue: 0};
    var COLOR_CALIBRATED = {red: 0, green: 255, blue: 0};
    var COLOR_ARRIVED = { red: 0, green: 0, blue: 255};
    var MINIMUM_INTENSITY = 55;

    this.COLOR = {"GREEN": "GREEN", "RED": "RED", "BLUE": "BLUE", "YELLOW": "YELLOW"};

    function _init() {
        _pigment = new Pigment(_droid);

        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.SEARCHING:
                    break;
                case _droid.STATE.READY:
                case _droid.STATE.CONNECTED:
                    break;
            }
        });
    }

    this.updateColor = function(color, intensity) {
        var intensity = MINIMUM_INTENSITY + Math.round((255 - MINIMUM_INTENSITY) * intensity);
        intensity = (intensity > 255) ? 255 : intensity;

        //Logger.log("_updateColor", intensity, _direction);

        if (color == _this.COLOR.GREEN) {
            _pigment.setColor({ red: 0, green: intensity, blue: 0 }, true);
        } else if (color == _this.COLOR.RED) {
            _pigment.setColor({ red: intensity, green: 0, blue: 0 }, true);
        } else if (color == _this.COLOR.YELLOW) {
            _pigment.setColor({ red: intensity, green: intensity, blue: 0 }, true);
        } else if (color == _this.COLOR.BLUE) {
            _pigment.setColor({ red: 0, green: 0, blue: intensity }, true);
        }
    }

    _init();
}