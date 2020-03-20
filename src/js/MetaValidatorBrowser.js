
// entry point for browser bundle

const HTMLParser = require('./HTMLParser.js');

// reuse the minified validator, so I don't have to minify it myself
const validator  = require('validator/validator.min.js');

var App               = require('./App.js');
var MetaValidatorCore = require('./MetaValidatorCore.js');

Object.assign(App, MetaValidatorCore, {

    // defaults to current url if window object exists (for bookmarklet usage)
    url: typeof window != 'undefined' && window.location ? window.location.toString() : '',

    // load missing schema.org definitions on run time
    // use hard coded api url while developing (also to not break bookmarklet usage)
    schemaOrgApiUrl: 'http://localhost/seo-meta-validator/ui/api',

    HTMLParser: HTMLParser,
    validator:  validator,

    schemaOrgSchemas: {},
    schemaOrgProperties: {},

    /**
     * Fetch Url and return html string
     *
     * @param   String  url
     * @return  String
     */
    fetchUrl: async function(url) {

        return await this.request(url, null, 'html');

    },

    // preload all schemas and properties from api and save it to localStorage
    preloadSchemaOrgData: function(fn) {

        var $this = this;

        var url = this.schemaOrgApiUrl + '/all';

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
