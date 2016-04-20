/**
 * Created by davdeev on 4/21/16.
 */

var express = require('express');
var router = express.Router();
var bb8 = require('../bb8.js');
var droid = null;

router.get('/connect', function(request, response, next) {
    var bb8Id = request.param("bb8Id");

    if (droid) {
        droid.disconnect();
    }

    droid = new bb8(bb8Id);
    droid.connect(function () {
        response.json({status: "connected"});
    });
});

module.exports = router;
