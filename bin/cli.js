#!/usr/bin/env node

var   MetaValidator      = require('../src/js/MetaValidatorCLI.js');
const temporaryCliOutput = require('../src/js/temporaryCliOutput.js');

const argv = require('yargs')
.option('url', {
    alias: 'u',
    type: 'string',
    description: 'Inspect a URL',
    required: true
})
.option('presets', {
    alias: 'p',
    type: 'string',
    description: 'Test for specific markup from a list of presets'
})
.option('autodetect', {
    alias: 'a',
    type: 'boolean',
    description: 'Autodetect'
})
.option('strict', {
    alias: 's',
    type: 'boolean',
    description: 'Strict parsing (default: false)'
})
.argv;

var url     = argv.url;
var options = {};

if (argv.hasOwnProperty('autodetect')) options.autodetect = argv.autodetect;
if (argv.hasOwnProperty('strict'))     options.strict = argv.strict;

if (argv.presets) {
    options.presets = typeof argv.presets == 'string'
        ? argv.presets.split(',').map(e => e.trim()) : argv.presets;
}

// pass cli output function to finish event
MetaValidator.on('finished', temporaryCliOutput);

// run validator
MetaValidator.run(url, options);
