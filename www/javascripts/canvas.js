/**
 * Created by davdeev on 4/23/16.
 */

function DirectionCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.05;

    this.draw = function(data) {
        paper.setup(_canvas);
        var _point = {x: _canvas.width/4, y: _canvas.height/4};

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
                _context.lineWidth = 1;
                _context.strokeStyle = 'red';
                _context.stroke();
            }
        });
    }
}

function PointsCanvas(canvas) {
    var _canvas = canvas;
    var _context = canvas.getContext("2d");
    var SCALE = 0.25;

    this.draw = function(data) {
        paper.setup(_canvas);
        var isStarted = false;
        var _point = {x: _canvas.width/4, y: _canvas.height/4};
        var dX = 0;
        var dY = 0;
        console.clear();

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
            //
            //var rads = point.absoluteAngle * Math.PI / 180;
            //var range = point.range;
            //
            //if (point.isCollision) {
            //    range = range * (point.timeEnd - point.timeStart) / point.estimatedTime;
            //}
            //
            //var x = Math.round(range * Math.cos(rads)) * SCALE;
            //var y = Math.round(range * Math.sin(rads)) * SCALE;

            //_point.x += x;
            //_point.y += y;
            //path.strokeColor = color;
            //pointer = pointer.add([x, y]);
            //path.lineTo(pointer);

            point.x = Math.round(dX + point.x * SCALE);
            point.y = Math.round(dY + point.y * SCALE);

            console.log(_point.x,_point.y, point.x, point.y, dX, dY);

            _point = point;

            _context.strokeStyle = color;
            _context.lineTo(_point.x,_point.y);
            _context.stroke();

            if (point.isCollision) {
                _context.beginPath();
                _context.arc(_point.x, _point.y, 1, 0, 2 * Math.PI, false);
                _context.fillStyle = 'red';
                _context.fill();
                _context.lineWidth = 1;
                _context.strokeStyle = 'red';
                _context.stroke();
            }
        });
    }
}
