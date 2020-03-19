
// entry point for browser bundle

const HTMLParser = require('./HTMLParser.js');

// reuse the minified validator, so I don't have to minify it myself
const validator  = require('validator/validator.min.js');

// load subsets of schema files to avoid loading the whole schemas (>1MB) and
// to reduce number of api requests
const schemaOrgDefinitions = require('./schemas/common_schemas.json');
const schemaOrgProperties  = require('./schemas/common_properties.json');
// const schemaOrgDefinitions = {};
// const schemaOrgProperties  = {};

var App               = require('./App.js');
var MetaValidatorCore = require('./MetaValidatorCore.js');

Object.assign(App, MetaValidatorCore, {

    // defaults to current url if window object exists (for bookmarklet usage)
    url: typeof window != 'undefined' && window.location ? window.location.toString() : '',

    // load missing schema.org definitions on run time
    // schemaOrgApiUrl: '',

    // use hard coded api url while developing (also to not break bookmarklet usage)
    schemaOrgApiUrl: 'http://localhost/seo-meta-validator/ui/api',

    HTMLParser: HTMLParser,
    validator:  validator,

    schemaOrgDefinitions: schemaOrgDefinitions,
    schemaOrgProperties:  schemaOrgProperties,

    /**
     * Fetch Url and return html string
     *
     * @param   String  url
     * @return  String
     */
    fetchUrl: async function(url) {

        return await this.request(url, null, 'html');

    },

    /**
     * get single schema definition
     * loads and updates definitions on runtime with rest api responses
     *
     * @param   String    schemaName
     * @param   Object    options           Not implemented, yet
     * @return  mixed     Object | false
     */
    getSchemaOrgSchema: async function (schemaName, options) {

        if (this.schemaOrgDefinitions[schemaName]) {
            return this.schemaOrgDefinitions[schemaName];
        }

        var url = this.schemaOrgApiUrl + '/schema/' + schemaName;

        var response = await this.request(url);

        if (!response.error) {
            this.schemaOrgDefinitions[schemaName] = response;
            return response;
        }

        return false;

    },

    /**
     * get single schema property definition
     * loads and updates definitions on runtime with rest api responses
     *
     * @param   String    schemaName
     * @param   Object    options           Not implemented, yet
     * @return  mixed     Object | false
     */
    getSchemaOrgProperty: async function (propertyName, options) {

        if (this.schemaOrgProperties[propertyName]) {
            return this.schemaOrgProperties[propertyName];
        }

        var url = this.schemaOrgApiUrl + '/property/' + propertyName;

        var response = await this.request(url);

        if (!response.error) {
            this.schemaOrgProperties[propertyName] = response;
            return response;
        }

        return false;

    },

    sleep: async function(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    },

});


module.exports = App;
