
const { Facebook, Google } = require('structured-data-testing-tool/presets.js');

const SEO     = require('./presets/SEO.js');
const Twitter = require('./presets/Twitter.js');

module.exports = {
    SEO:      SEO,
    Google:   Google,
    Twitter:  Twitter,
    Facebook: Facebook,
};
