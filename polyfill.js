/* Polyfill for non userscript environments */
/* eslint-disable camelcase, no-unused-vars */

function GM_addStyle(styles) {
	const style = document.createElement('style');
	style.textContent = styles;
	(document.head || document.body || document.documentElement || document).appendChild(style);
}

function GM_xmlhttpRequest(options) {
	const request = new XMLHttpRequest();

	request.onload = function() {
		options.onload(this);
	};

	request.onerror = function() {
		options.onerror(this);
	};

	request.ontimeout = function() {
		options.ontimeout(this);
	};

	request.open(options.method, options.url);

	if (options.headers) {
		for (const header in options.headers) {
			if (options.headers.hasOwnProperty(header)) {
				request.setRequestHeader(header, options.headers[header]);
			}
		}
	}

	if (typeof options.timeout !== 'undefined') {
		request.timeout = options.timeout;
	}

	if (typeof options.data === 'undefined') {
		request.send();
	} else {
		request.send(options.data);
	}
}

var originalConsoleLog = console.log;
console.log = function() {
    args = [];
    args.push('[Clutterfree] ');
    for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    originalConsoleLog.apply(console, args);
}