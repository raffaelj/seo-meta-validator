
// entry point for cli

const fetch         = require('node-fetch');
const jsdom         = require('jsdom');
const { JSDOM }     = jsdom;
const validator     = require('validator');

const schemaOrgDefinitions = require('./schemas/schemas.json');
const schemaOrgProperties  = require('./schemas/properties.json');

var MetaValidatorCore = require('./MetaValidatorCore.js');

const HTMLParser = {

    parse: function (html, options) {

        var DOMParser = new JSDOM().window.DOMParser;
        var parser    = new DOMParser();

        return parser.parseFromString(html, 'text/html');
    },

};

var MetaValidator = Object.assign(MetaValidatorCore, {

    HTMLParser: HTMLParser,

    schemaOrgDefinitions: schemaOrgDefinitions,
    schemaOrgProperties:  schemaOrgProperties,

    fetchUrl: async function(url, options) {

        const res  = await fetch(url);
        const html = await res.text();

        return html;

    },

    getSchemaOrgSchema: function (schemaName, options) {

        if (this.schemaOrgDefinitions[schemaName]) {
            return this.schemaOrgDefinitions[schemaName];
        }

        return false;

    },

    getSchemaOrgProperty: function (propertyName, options) {

        if (this.schemaOrgProperties[propertyName]) {
            return this.schemaOrgProperties[propertyName];
        }

        return false;

    },

});

module.exports = MetaValidator;
