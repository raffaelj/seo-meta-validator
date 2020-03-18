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
.argv;

var url = argv.url;

var options = {
    presets: ['Google', 'Twitter', 'Facebook']
};

// pass cli output function to finish event
MetaValidator.on('finished', temporaryCliOutput);

// run validator
MetaValidator.run(url, options);
