"use strict";

var Notifier = module.exports = function Notifier() {
    var _listeners = {};

    this.addListener = function(event, listener) {
        if (!_listeners[event]) {
            _listeners[event] = new Array();
        }

        _listeners[event].push(listener);
    }

    this.removeListener = function(event, listener) {
        if (!_listeners[event]) {
            return;
        }

        var i = _getListener(event, listener);

        if (i > -1) {
            _listeners[event][i] = null;
        }
    }

    this.fireEvent = function(event, data) {
        if (!_listeners[event]) {
            return;
        }

        for (var i=0; i< _listeners[event].length; i++) {
            if (_listeners[event][i] != null) {
                _listeners[event][i](data);
            }
        }
    }

    var _getListener = function(event, listener) {
        if (!_listeners[event]) {
            return -1;
        }

        for (var i=0; i<_listeners[event].length; i++) {
            if (_listeners[event][i] == listener) {
                return i;
            }
        }
        return -1;
    }
}