/**
 * Created by davdeev on 4/22/16.
 */

function Api() {
    var _isConnected = false;
    var _this = this;

    this.isConnected = function() {
        return _isConnected;
    }

    this.connect = function (id, callback) {
        if (_isConnected) {
            callFunction(callback);
            return;
        }

        $.get("/connect/?deviceId=" + id, function () {
            _isConnected = true;
            callFunction(callback);
        });
    }

    this.disconnect = function (id, callback) {
        if (!_isConnected) {
            return;
        }

        $.get("/disconnect/?deviceId=" + id, function () {
            _isConnected = false;
            callFunction(callback);
        });
    }

    this.startCalibration = function (id, callback) {
        _this.connect(id, function () {
            $.get("/startCalibration/?deviceId=" + id, function () {
                callFunction(callback);
            });
        });
    }

    this.completeCalibration = function (id, callback) {
        if (!_isConnected) {
            return;
        }
        $.get("/completeCalibration/?deviceId=" + id, function () {
            callFunction(callback);
        });
    }

    this.startNavigation = function (id, callback) {
        _this.connect(id, function () {
            $.get("/startNavigation/?deviceId=" + id, function () {
                callFunction(callback);
            });
        });
    }

    this.cancelNavigation = function (id, callback) {
        if (!_isConnected) {
            return;
        }

        $.get("/cancelNavigation/?deviceId=" + id, function () {
            callFunction(callback);
        });
    }

    this.getRssi = function (id, callback) {
        if (!_isConnected) {
            return;
        }

        $.get("/getRssi/?deviceId=" + id, function (data) {
            callFunction(callback, data);
        });
    }

    this.discoverDevices= function (callback) {
        $.get("/discoverDevices", function (devices) {
            if (callback) {
                callback(devices);
            }
        });
    }

    this.getPoints = function (id, callback) {
        if (!_isConnected) {
            return;
        }

        $.get("/getPoints/?deviceId=" + id, function (points) {
            if (callback) {
                callback(points);
            }
        });
    }
}


