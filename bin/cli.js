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
.argv;

var url = argv.url;

var options = {
    autodetect: true,
};

if (argv.presets) {
    options.presets = typeof argv.presets == 'string'
        ? argv.presets.split(',').map(e => e.trim()) : argv.presets;
}

// pass cli output function to finish event
MetaValidator.on('finished', temporaryCliOutput);

// run validator
MetaValidator.run(url, options);
