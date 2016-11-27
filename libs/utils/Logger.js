/**
 * Created by davdeev on 4/23/16.
 */

module.exports = Logger = {};

Logger.startTime = (new Date()).getTime();
Logger.getTime = function() {
    return (new Date()).getTime() - Logger.startTime;
};

Logger.log = function() {
    //arguments.unshift(Logger.getTime());
    //arguments.push(Logger.getTime());
    var _arguments = new Array();
    _arguments.push(Logger.getTime() + "s : ");

    for (var i=0; i<arguments.length; i++) {
        _arguments.push(arguments[i]);
    }

    console.log.apply(console, _arguments);
    //console.log(arguments);
}
