/**
 * Created by davdeev on 4/23/16.
 */

var Logger = require("./Logger");

var Decorator = module.exports = function Decorator(droid) {
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