/**
 * Created by davdeev on 4/23/16.
 */

function Application() {

    var _api = new Api();
    var _pointsCanvas = new PointsCanvas(document.getElementById('canvas1'));
    var _directionsCanvas = new DirectionCanvas(document.getElementById('canvas2'));
    var _this = this;
    var _rssiUpdateInterval = null;

    this.connect = function() {
        _api.connect($("#deviceId").val(), function(){
            _updateConnectedStatusUi();
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
        _api.gotToBase($("#deviceId").val(), _onMove);
    }

    this.cancelNavigation = function() {
        _api.cancelNavigation($("#deviceId").val(), function() {
            _stopUpdateRssi();
            _stopUpdatePoints();
        });
    }

    this.discoverDevices = function() {
        _api.discoverDevices(function(devices) {
            _updateDevicesSelectUi(devices);
        });
    }

    this.move = function(angle) {
        _api.move($("#deviceId").val(), $("#range").val(), $("#speed").val(), angle, _onMove);
    }

    var _onMove = function(_points) {
        _api.getRssi($("#deviceId").val(), function (_data) {
            _updateRssiUi(_data);
        });
        console.clear();
        $.each(_points.points, function(index, point) {
            console.log(point);
        });
        _pointsCanvas.draw(_points);
        _directionsCanvas.draw(_points);
    }

    var _startUpdateRssi = function() {
        _stopUpdateRssi();

        _rssiUpdateInterval = setInterval(function () {
            _api.getRssi($("#deviceId").val(), function (data) {
                _updateRssiUi(data);
            });
        }, 1500);
    }

    var _stopUpdateRssi = function() {
        stopInterval(_rssiUpdateInterval);
    }

    var _updateRssiUi = function (data) {
        $("#rssi .bar").width((100 + data.rssi) + "%");
        $("#rssi .value").html(data.rssi + "(" + data.rssiLimit + "/" + data.txPowerLevel + ")");
        _updateConnectedStatusUi();
    }

    var _updateDevicesSelectUi = function (devices) {
        var select = $("#deviceId");
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

