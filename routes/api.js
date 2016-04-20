/**
 * Created by davdeev on 4/21/16.
 */

var express = require('express');
var router = express.Router();
var bb8 = require('../bb8.js');
var droid = null;

router.get('/connect', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        if (droid.getId() != id) {
            droid = new bb8(id);
        } else {
            droid.disconnect();
        }
    } else {
        droid = new bb8(id);
    }

    droid.connect(function () {
        response.json({status: "connected"});
    });
});

router.get('/disconnect', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        droid.disconnect(function () {
            response.json({status: "disconnected"});
        });
    }
});

router.get('/startCalibration', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        droid.startCalibration();
        response.json({status: "started"});
    }
});

router.get('/completeCalibration', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        droid.completeCalibration();
        response.json({status: "completed"});
    }
});

router.get('/startNavigation', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        droid.startNavigation();
        response.json({status: "completed"});
    }
});

router.get('/cancelNavigation', function(request, response, next) {
    var id = request.param("id");

    if (droid) {
        droid.cancelNavigation();
        response.json({status: "completed"});
    }
});

module.exports = router;
