/**
 * Created by davdeev on 4/22/16.
 */

function Api() {
    var _isConnected = false;
    var _this = this;

    this.isConnected = function() {
        return _isConnected;
    }

    var _droidData;

    this.connect = function (id, callback) {
        if (_isConnected) {
            callFunction(callback, _droidData);
            return;
        }

        $.get("/connect/?deviceId=" + id, function (droidData) {
            _droidData = droidData;
            _isConnected = true;
            callFunction(callback, droidData);
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

    this.goHome = function (id, callback) {
        if (!_isConnected) {
            return;
        }
        $.get("/goHome/?deviceId=" + id, function (points) {
            callFunction(callback, points);
        });
    }

    this.move = function (id, range, speed, angle, callback) {
        if (!_isConnected) {
            return;
        }
        $.get("/move/?deviceId=" + id + "&range=" + range + "&speed=" + speed + "&angle=" + angle, function (points) {
            callFunction(callback, points);
        });
    };

    this.turn = function (id, angle, callback) {
        if (!_isConnected) {
            return;
        }
        $.get("/turn/?deviceId=" + id + "&angle=" + angle, function () {
            callFunction(callback);
        });
    };

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


