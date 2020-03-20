
// entry point for cli

const fetch         = require('node-fetch');
const jsdom         = require('jsdom');
const { JSDOM }     = jsdom;
const validator     = require('validator');

const schemaOrgSchemas = require('./schemas/schemas.json');
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

    schemaOrgSchemas: schemaOrgSchemas,
    schemaOrgProperties: schemaOrgProperties,
    validator: validator,

    fetchUrl: async function(url, options) {

        const res  = await fetch(url);
        const html = await res.text();

        return html;

    },

});

module.exports = MetaValidator;
