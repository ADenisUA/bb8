/**
 * Created by davdeev on 4/23/16.
 */

function stopTimeout(id) {
    if (id) {
        clearTimeout(id);
        id = null;
    }
}

function stopInterval(id) {
    if (id) {
        clearInterval(id);
        id = null;
    }
}

function callFunction(_function, _data) {
    if (_function) {
        _function(_data);
    }
}