function checkForDOM() {
    console.log('Checking for DOM');
    if (document.body && document.head) {
        insertScript();
    } else {
        requestIdleCallback(checkForDOM);
    }
}

function insertScript() {
    console.log('Injecting interceptor script into DOM...');
    _script = document.createElement('script');
    _script.setAttribute('type', 'text/javascript');
    _script.setAttribute('src', chrome.runtime.getURL('interceptor-script.js'));
    (document.head || document.documentElement).appendChild(_script);
    console.log('Interceptor script injected.');
    _script.onload = function () {
        console.log('Interceptor script loaded.');
        _script.parentNode.removeChild(_script);
    };
}

requestIdleCallback(checkForDOM);