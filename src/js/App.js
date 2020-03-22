/**
 * modified variant from Cockpit CMS - App.js
 * Cockpit CMS, (c) Artur Heinze, MIT License, https://github.com/agentejo/cockpit
 * source: https://github.com/agentejo/cockpit/blob/next/assets/app/js/app.js
 */

var App = {

    version: '0.1.0', // should be dynamic

    base_route: typeof window != 'undefined' ? window.location.pathname.replace(/\/$/, '') : '',
    base_url:   typeof window != 'undefined' ? window.location.pathname.replace(/\/$/, '') : '',
    site_url:   typeof window != 'undefined' ? window.location.origin : '',

    route: function(url) {

        if (url.indexOf('http') == 0 || url.indexOf('//') == 0) return url;

        return this.base_route + '/' + url.replace(/^\//, '');

    },
    
    base: function(url) {
        return this.route(url);
    },

    request: function(url, data, type) {

        url  = this.route(url);
        type = type || 'json';

        return new Promise(function (fulfill, reject){

            var xhr = new XMLHttpRequest();

            xhr.open('post', url, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            url += (url.indexOf('?') !== -1 ? '&':'?') + 'nc=' + Math.random().toString(36).substr(2);

            if (data) {

                if (typeof(data) === 'object' && data instanceof HTMLFormElement) {
                    data = new FormData(data);
                } else if (typeof(data) === 'object' && data instanceof FormData) {
                    // do nothing
                } else if (typeof(data) === 'object') {

                    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                    data = JSON.stringify(data || {});
                }
            }

            xhr.onloadend = function () {

                var resdata = xhr.responseText;

                if (type == 'json') {
                    try {
                        resdata = JSON.parse(xhr.responseText);
                    } catch(e) {
                        resdata = null;
                    }
                }

                if (this.status == 200) {
                    fulfill(resdata, xhr);
                } else {
                    reject(resdata, xhr);
                }
            };

            // send the collected data as JSON
            xhr.send(data);
        });

    },

};

App.assets = {

    _ress: {},

    require: function(ress, onSuccess, onError) {

        onSuccess = onSuccess || function(){};
        onError = onError ||  function(){};

        var req  = [],
            ress = Array.isArray(ress) ? ress:[ress];

        for (var i=0, len=ress.length; i<len; i++) {

            if (!ress[i]) continue;

            if (!this._ress[ress[i]]) {

                if (ress[i].match(/\.js$/i)) {
                    this._ress[ress[i]] = this.getScript(ress[i]);
                } else if (ress[i].match(/\.json$/i)) {
                    this._ress[ress[i]] = this.getScript(ress[i], 'json');
                } else if(ress[i].match(/\.(jpg|jpeg|gif|png)$/i)) {
                    this._ress[ress[i]] = this.getImage(ress[i]);
                } else if(ress[i].match(/\.css$/i)) {
                    this._ress[ress[i]] = this.getCss(ress[i]);
                } else {
                    continue;
                }
            }

            req.push(this._ress[ress[i]]);
        }

        return Promise.all(req).then(onSuccess).catch(function(e){
            onError.apply(self, [e]);
        });
    },

    getScript: function(url) {

        return new Promise(function(resolve, reject) {

            var script = document.createElement('script');

            script.async = true;

            script.onload = function() {
                resolve(url);
            };

            script.onerror = function() {
                reject(url);
            };

            script.src = (url.match(/^(\/\/|http)/) ? url : App.base(url))+'?v='+App.version;

            document.getElementsByTagName('head')[0].appendChild(script);

        });
    },

    getCss: function(url){

      return new Promise(function(resolve, reject) {

          var link      = document.createElement('link');
              link.type = 'text/css';
              link.rel  = 'stylesheet';
              link.href = (url.match(/^(\/\/|http)/) ? url : App.base(url))+'?v='+App.version;

          document.getElementsByTagName('head')[0].appendChild(link);

          var img = document.createElement('img');
              img.onerror = function(){
                  resolve(url);
              };
              img.src = link.href;
        });
    },

    getImage: function(url){

        return new Promise(function(resolve, reject) {

            var img = document.createElement('img');

            img.onload  = function(){ resolve(url); };
            img.onerror = function(){ reject(url); };

            img.src = (url.match(/^(\/\/|http)/) ? url : App.base(url))+'?v='+App.version;
        });
    }
};

module.exports = App;
