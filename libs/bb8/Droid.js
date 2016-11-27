"use strict";

var sphero = require("sphero");
var Logger = require("./../utils/Logger");
var Brain = require("./Brain");
var Skin = require("./Skin");
var Muscles = require("./Muscles");
var Sensors = require("./Sensors");
var Notifier = require("./../utils/Notifier");

var Droid = module.exports = function Droid(btDevice) {

    var _this = this;
    var _btDevice = (typeof(btDevice) == "String") ? null : btDevice;
    var _id = (typeof(btDevice) != "String") ? btDevice.uuid : btDevice;

    this.EVENT = {"STATE_CHANGED": "STATE_CHANGED"};
    var _notifier = new Notifier();
    this.getNotifier = function () {return _notifier};

    this.STATE = {"DISCONNECTED": "DISCONNECTED", "READY": "READY", "CALIBRATING": "CALIBRATING", "SEARCHING": "SEARCHING", "CONNECTED": "CONNECTED", "CONNECTING": "CONNECTING"};
    var _state = this.STATE.DISCONNECTED;

    var _sphero = null;
    this.getSphero = function() { return _sphero;};

    var _muscles = new Muscles(this);
    this.getMuscles = function () {return _muscles};

    var _brain = new Brain(this);
    this.getBrain = function() {return _brain};

    var _skin = new Skin(this);
    this.getSkin = function () {return _skin};

    var _sensors = new Sensors(this);
    this.getSensors = function () {return _sensors};


    this.getState = function() {return _state};
    this.setState = function(state) {
        _state = state;
        _notifier.fireEvent(this.EVENT.STATE_CHANGED, state);
    }

    this.getId = function() {
        return _id;
    };

    this.connect = function(callback) {
        if (!_sphero && _state != _this.STATE.CONNECTING) {
            _this.setState(_this.STATE.CONNECTING);

            _sphero = sphero(_id, {"peripheral": _btDevice});
            _sphero.on("ready", function() {
                _sphero.setDefaultSettings();
                _sphero.stopOnDisconnect();

                _this.setState(_this.STATE.CONNECTED);

                if (callback) callback();
            });

            _sphero.connect(function() {

            });

        } else if (_state != _this.STATE.DISCONNECTED) {
            if (callback) callback();
        }
    }

    this.disconnect = function(callback) {
        _this.setState(_this.STATE.DISCONNECTED);

        if (callback) callback();
    }

}