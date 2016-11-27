"use strict";

var Logger = require("./../utils/Logger");
var Сerebellum = require("./Сerebellum");
var FindSignal = require("./skills/FindSignal");

var Brain = module.exports = function Brain(droid) {
    var _this = this;
    var _droid = droid;
    var _cerebellum = null;
    var _skills = {};

    function _init() {

        _cerebellum = new Сerebellum(_droid);
        _skills[FindSignal.NAME] = new FindSignal(_this);

        _droid.getNotifier().addListener(_droid.EVENT.STATE_CHANGED, function(state) {
            switch (state) {
                case _droid.STATE.CONNECTED:

                    break;
                case _droid.STATE.DISCONNECTED:

                    break;
            }
        });
    }

    this.getDroid = function() {
        return _droid;
    };

    this.getСerebellum = function() {
        return _cerebellum;
    };

    this.getSkill = function(skill) {
        return _skills[skill];
    };

    _init();
};