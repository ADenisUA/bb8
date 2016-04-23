/**
 * Created by davdeev on 4/23/16.
 */

function DirectionCanvas(canvas) {
    var _canvas = canvas;

    this.draw = function(points) {

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

        //paper.view.draw();
    }
}

/*
function draw() {
    // Get a reference to the canvas object
    var canvas = document.getElementById('canvas');
    // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    // Create a Paper.js Path to draw a line into it:
    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([ 200, -50 ]));
    // Draw the view now:
    paper.view.draw();
}
*/
