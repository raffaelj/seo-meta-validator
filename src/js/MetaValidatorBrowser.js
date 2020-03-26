
// entry point for browser bundle

const HTMLParser = require('./HTMLParser.js');

// reuse the minified validator, so I don't have to minify it myself
const validator  = require('validator/validator.min.js');

var App               = require('./App.js');
var MetaValidatorCore = require('./MetaValidatorCore.js');

Object.assign(App, MetaValidatorCore, {

    // will be replaced with package version via browserify-versionify transform
    version: '__VERSION__',

    // defaults to current url if window object exists (for bookmarklet usage)
    url: typeof window != 'undefined' && window.location ? window.location.toString() : '',

    // load missing schema.org definitions on run time
    // use hard coded api url while developing (also to not break bookmarklet usage)
    schemaOrgApiUrl: 'http://localhost/seo-meta-validator/ui/api',

    requestProxy: 'http://localhost/seo-meta-validator/ui/api/schemas/fetch',

    HTMLParser: HTMLParser,
    validator:  validator,

    /**
     * Fetch Url and return html string
     *
     * @param   String  url
     * @return  Mixed
     */
    fetchUrl: async function (url, data, type = 'html') {

        // bookmarklet usage - no request needed
        if (window.location == url) {
            return document; // HTMLDocument
        }

        var crossOrigin = (this.route(url)).match(/^http/)
            && !(this.route(url)).match(new RegExp(`^${this.site_url}`));

        // different origin? If yes, use proxy for server side fetching
        // to prevent being blocked by CORS
        if (crossOrigin && this.requestProxy) {

            if (!data || typeof data != 'object') data = {};

            data.url = url;
            url      = this.requestProxy;
            type     = 'json';

        }

        var response = await this.request(url, data, type);

        if (typeof response == 'string') return response; // html string

        if (typeof response == 'object') {
            this.response.headers = response.headers;
            return response.html; // html string
        }

    },

    // preload all schemas and properties from api and save it to localStorage
    preloadSchemaOrgData: function (fn) {

        var $this = this;

        var url = this.schemaOrgApiUrl + '/schemas/subset';

        if (localStorage.hasOwnProperty('schemaOrgSchemas') && localStorage.hasOwnProperty('schemaOrgProperties')) {

            $this.schemaOrgSchemas = JSON.parse(localStorage.getItem('schemaOrgSchemas'));
            $this.schemaOrgProperties  = JSON.parse(localStorage.getItem('schemaOrgProperties'));

            if (fn && typeof fn == 'function') fn();

        }

        else {

            this.request(url).then(function(data) {

                $this.schemaOrgSchemas = data.schemas;
                $this.schemaOrgProperties  = data.properties;

                localStorage.setItem('schemaOrgSchemas',    JSON.stringify(data.schemas));
                localStorage.setItem('schemaOrgProperties', JSON.stringify(data.properties));

                if (fn && typeof fn == 'function') fn();

            });

        }

    },

});


module.exports = App;
