/**
 * Created by davdeev on 4/23/16.
 */

var LINE_WIDTH = 1;

function PointsCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.25;
    var dX = _canvas.width/2;
    var dY = _canvas.height/2;

    this.draw = function(data) {

        _context.clearRect(0, 0, _canvas.width, _canvas.height);
        _context.beginPath();
        _context.moveTo(dX, dY);

        var _point = {x: 0, y: 0};

        $.each(data.points, function(index, point) {

            if (rssi == 0) {
                rssi = point.rssi;
            }

            var dRssi = parseInt(point.rssi) - parseInt(point.lastRssi);
            var color = "grey";
            if (dRssi > 2) {
                color = "green";
            } else if (dRssi < 2) {
                color = "red"
            }

            _point.x = dX + Math.round(parseInt(point.x) * SCALE);
            _point.y = dY + Math.round(parseInt(point.y) * SCALE);

            _context.strokeStyle = color;
            _context.lineTo(_point.x, _point.y);
            _context.stroke();

            if (point.isCollision) {
                _context.beginPath();
                _context.arc(_point.x, _point.y, 1, 0, 2 * Math.PI, false);
                _context.fillStyle = 'red';
                _context.fill();
                _context.lineWidth = LINE_WIDTH;
                _context.strokeStyle = 'red';
                _context.stroke();
            }

            _context.beginPath();
            _context.moveTo(_point.x, _point.y);
        });
    }
}

function DirectionCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.1;

    this.draw = function(data) {

        var _point = {x: 0, y: 0};

        _context.clearRect(0, 0, _canvas.width, _canvas.height);

        $.each(data.points, function(index, point) {

            _context.beginPath();
            _context.moveTo(_canvas.width/2, _canvas.height/2);

            var dRssi = parseInt(point.rssi) - parseInt(point.lastRssi);
            var color = "grey";
            if (dRssi > 2) {
                color = "green";
            } else if (dRssi < 2) {
                color = "red"
            }

            point.x = Math.round(parseInt(point.x) * SCALE) - _point.x;
            point.y = Math.round(parseInt(point.y) * SCALE) - _point.y;

            _context.strokeStyle = color;
            _context.lineTo(point.x, point.y);
            _context.stroke();

            _point = point;
        });
    }
}
