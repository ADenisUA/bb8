/**
 * Created by davdeev on 4/23/16.
 */

function Application() {

    var GOTO_BASE_TIMEOUT = 2000;
    var UPDATE_RSSI_INTERVAL = 1000;

    var _api = new Api();
    var _pointsCanvas = new PointsCanvas(document.getElementById('canvas1'));
    var _directionsCanvas = new DirectionCanvas(document.getElementById('canvas2'));
    var _this = this;
    var _rssiUpdateInterval = null;
    var _isNavigatingToBase = false;
    var _droidData = null;

    this.connect = function() {
        _api.connect($("#deviceId").val(), function(droidData){
            _droidData = droidData;
            _droidData.lastRssi = 0;
            _updateConnectedStatusUi();
            _startUpdateRssi();
        });
    }

    this.disconnect = function() {
        _api.disconnect($("#deviceId").val(), function(){
            _updateConnectedStatusUi();
        });
    }

    this.startCalibration = function() {
        _api.startCalibration($("#deviceId").val(), function(data) {
            _startUpdateRssi();
        });
    }

    this.completeCalibration = function() {
        _api.completeCalibration($("#deviceId").val(), function() {
            _stopUpdateRssi();
        });
    }

    this.startNavigation = function() {
        _isNavigatingToBase = true;
        //_startUpdateRssi();
        _goToBase(_onGoToBase);
    }

    this.cancelNavigation = function() {
        _isNavigatingToBase = false;
        //_stopUpdateRssi();
    }

    this.discoverDevices = function() {
        _api.discoverDevices(function(devices) {
            _updateDevicesSelectUi(devices);
        });
    }

    var _goToBase = function(callback) {
        _api.goHome($("#deviceId").val(), callback);
    }

    var _onGoToBase = function(_points) {
        _onMove(_points);
        if (_isNavigatingToBase) {
            setTimeout(function() {
                _goToBase(_onGoToBase);
            }, GOTO_BASE_TIMEOUT);
        }
    }

    this.move = function(angle) {
        _api.move($("#deviceId").val(), $("#range").val(), $("#speed").val(), angle, _onMove);
    };

    this.turn = function(angle) {
        _api.turn($("#deviceId").val(), angle);
    };

    var _onMove = function(_points) {
        _droidData.lastRssi = _droidData.rssi;
        //_api.getRssi($("#deviceId").val(), function (_data) {
        //    _updateRssiUi(_data);
        //});

        //console.clear();
        //$.each(_points.points, function(index, point) {
        //    console.log(point);
        //});
        _pointsCanvas.draw(_points);
        _directionsCanvas.draw(_points);

        var point = _points.points.pop();
        _droidData.rssi = point.rssi;
        _droidData.powerState = point.powerState;

        _updateRssiUi(_droidData);
    }

    var _startUpdateRssi = function() {
        _stopUpdateRssi();

        // _rssiUpdateInterval = setInterval(function () {
        //     _api.getRssi($("#deviceId").val(), function (data) {
        //         _updateRssiUi(data);
        //     });
        // }, UPDATE_RSSI_INTERVAL);
    }

    var _stopUpdateRssi = function() {
        stopInterval(_rssiUpdateInterval);
    }

    var _updateRssiUi = function (data) {
        $("#rssi .bar").width((100 + data.rssi) + "%");
        $("#rssi .value").html(data.rssi + "(" + data.rssiLimit + "/" + _droidData.lastRssi + ")");
        $("#powerState").val(data.powerState);
        _droidData.rssiLimit = data.rssiLimit;
        _updateConnectedStatusUi();
    }

    var _updateDevicesSelectUi = function (devices) {
        var select = $("#deviceId");
        select.empty();
        $.each(devices, function (index, device) {
            select.append($(new Option(device.name, device.uuid)));
        });
    }

    var _updateConnectedStatusUi = function() {
        $("#deviceStatus").val(_api.isConnected() ? "Connected" : "Disconnected");
    }

    _updateConnectedStatusUi();
    _this.discoverDevices();
}

