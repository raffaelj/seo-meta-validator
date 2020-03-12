#!/usr/bin/env node

const fetch         = require('node-fetch');
const jsdom         = require('jsdom');
const { JSDOM }     = jsdom;

var   MetaValidator = require('../src/js/MetaValidator.js');
const cliOutput     = require('../src/js/MetaValidatorCLI.js');

const argv = require('yargs')
.option('url', {
    alias: 'u',
    type: 'string',
    description: 'Inspect a URL',
    required: true
})
.argv;

// replace fetchUrl function to use node-fetch instead of xhr request
MetaValidator.fetchUrl = async function(url, options) {

    const res  = await fetch(url);
    const html = await res.text();

    this.runExtractor(html);
};

// replace DOMParser with jsdom
MetaValidator.HTMLParser.parse = function (html, options) {

    var DOMParser = new JSDOM().window.DOMParser;
    var parser    = new DOMParser();

    return parser.parseFromString(html, 'text/html');
};

var url = argv.url;
var options = {
    presets: ['Google', 'Twitter', 'Facebook']
};

// pass cli output function to finish event
MetaValidator.on('finished', cliOutput);

// run validator
MetaValidator.run(url, options);
