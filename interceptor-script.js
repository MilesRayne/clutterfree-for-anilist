function redefineXHRsend() {
    console.log("Executing redefineXHRsend script...");
    var XHR = XMLHttpRequest.prototype;
    var send = XHR.send;
    var open = XHR.open; XHR.open = function (method, url) {
        this.url = url;
        return open.apply(this, arguments);
    };
    XHR.send = function () {
        this.addEventListener('load', function () {
            console.log('Yes, I am ready!');
            if (this.url.includes('https://anilist.co/graphql')) {
                var dataDOMElement = document.createElement('div');
                dataDOMElement.id = '__interceptedData';
                dataDOMElement.innerText = this.response;
                dataDOMElement.style.height = 0;
                dataDOMElement.style.overflow = 'hidden';
                document.body.appendChild(dataDOMElement);
            }
        });
        return send.apply(this, arguments);
    };
}