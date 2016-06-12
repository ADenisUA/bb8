/**
 * Created by davdeev on 4/23/16.
 */

var LINE_WIDTH = 1;

function PointsCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.5;

    this.draw = function(data) {

        var isStarted = false;
        var _point = {x: _canvas.width/2, y: _canvas.height/2};
        var dX = 0;
        var dY = 0;

        $.each(data.points, function(index, point) {

            if (!isStarted) {
                dX = _point.x - point.x * SCALE;
                dY = _point.y - point.y * SCALE;
                isStarted = true;
            }

            _context.beginPath();
            _context.moveTo(_point.x, _point.y);

            var dRssi = point.rssi - point.lastRssi;
            var color = "grey";
            if (dRssi > 2) {
                color = "green";
            } else if (dRssi < 2) {
                color = "red"
            }

            point.x = Math.round(dX + point.x * SCALE);
            point.y = Math.round(dY + point.y * SCALE);

            _point = point;

            _context.strokeStyle = color;
            _context.lineTo(_point.x,_point.y);
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
        });
    }
}

function DirectionCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.25;

    this.draw = function(data) {

        var _point = {x: _canvas.width/2, y: _canvas.height/2};

        $.each(data.points, function(index, point) {

            _context.beginPath();
            _context.moveTo(_point.x, _point.y);

            var dRssi = point.rssi - point.lastRssi;
            var color = "grey";
            if (dRssi > 2) {
                color = "green";
            } else if (dRssi < 2) {
                color = "red"
            }

            var rads = point.absoluteAngle * Math.PI / 180;
            var range = point.range;

            if (point.isCollision) {
                range = range * (point.timeEnd - point.timeStart) / point.estimatedTime;
            }

            var x = Math.round(range * Math.cos(rads)) * SCALE;
            var y = Math.round(range * Math.sin(rads)) * SCALE;

            _point.x += x;
            _point.y += y
            _context.strokeStyle = color;
            _context.lineTo(_point.x,_point.y);
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
        });
    }
}
