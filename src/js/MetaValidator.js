
const jmespath          = require('jmespath');

// to do: move entry points, browser should have the whole json included, cli should use fs
const schemaDefinitions = require('structured-data-testing-tool/schemas.json');

const presets       = require('./presets.js');
var   App           = require('./App.js');
const HTMLParser    = require('./HTMLParser.js');
const MetaExtractor = require('./MetaExtractor.js');

const defaultPresets = Object.assign({
    Default: {name: 'Default', presets: ['SEO', 'Google']}
}, presets)

Object.assign(App, {

    // defaults to current url if window object exists (for bookmarklet usage)
    url: typeof window != 'undefined' && window.location ? window.location.toString() : '',

    // has no effect yet
    usage: typeof window != 'undefined' ? 'browser' : 'cli',

    HTMLParser:        HTMLParser,
    MetaExtractor:     MetaExtractor,
    schemaValidator:   jmespath,

    schemaDefinitions: schemaDefinitions,

    defaultPresets:    defaultPresets,

    data:    {},
    tests:   [],
    presets: [],
    schemas: [],

    response: {
        passed:   [],
        failed:   [],
        warnings: [],
        optional: [],
        skipped:  [], // to do...
    },

    init: function(options) {

        // flush data in case of rerun with the same MetaValidator instance
        this.flush();

        // to do:
        // * change base_url
        // * change Parser
        // * display info
        // * ...

        if (options) {

            if (options.tests && Array.isArray(options.tests)) {
                this.tests = this.tests.concat(options.tests);
            }

            if (options.presets && Array.isArray(options.presets)) {
                this.presets = this.presets.concat(options.presets);
            }

        }

        if (!this.presets.length) this.presets.push(this.defaultPresets.Default);

    },

    run: function(url, options) {

        url = url || this.url;

        this.url = url;

        var $this = this;

        this.init(options);

        // if (this.usage == 'browser') {
            // this.request(url, null, 'html').then(function(html) {
                // $this.runExtractor();
            // });
        // }
        // else if (this.usage == 'cli') {
            
        // }
        
        this.fetchUrl(url);

    },

    // replace this method when running from cli
    fetchUrl: function(url) {

        var $this = this;

        this.request(url, null, 'html').then(function(html) {
            $this.runExtractor(html);
        });

    },

    runExtractor: function(html) {

        this.MetaExtractor.html = this.HTMLParser.parse(html);

        this.data = this.MetaExtractor.extract();

        // Not needed anymore ???
        // data = $this.fixWhiteSpacedMicroData(data);

        this.addMetaTagsToTests(); // useless ??? - only a self test on existing data
        this.addSchemasToTests(); // useless ??? - only a self test on existing data
        this.addPresetsToTests();

        this.runTests();

        this.trigger('finished');

    },

    runTests: function(data) {

        data = data || this.data;

        this.tests.forEach(test => {

            test.type = test.type || 'any';
            // to do: group

            var result = this.runSingleTest(test);

            this.formatResponse(result, test);

        });

    },

    runSingleTest: function(test, data) {

        data = data || this.data;

        test.type = test.type || 'any';

        var result;

        switch (test.type) {
            case 'metatag':
            case 'metatags':  result = this.validate(test, data.metatags); break;
            case 'jsonld':    result = this.validate(test, data.jsonld); break;
            case 'microdata': result = this.validate(test, data.microdata); break;
            case 'rdfa':      result = this.validate(test, data.rdfa); break;
            case 'htmltag':
            case 'htmltags':  result = this.validate(test, data.htmltags); break;
            case 'any':       result = this.validateAny(test, data); break;
        }

        return result;

    },

    validate: function(test, json) {

        if (!test || !json || !test.test) return false;

        var error,
            path  = test.test,
            value = this.schemaValidator.search(json, path);

        if (test.hasOwnProperty('expect')) {
            error = this.compareWithExpectedValue(value, test);
        }

        // If item not found (or has no value) then error
        else if (!value || value.length === 0) {
            error = {
                type: 'TEST_FAILED',
                message: `Test "${path}" failed`,
            };
        }

        return {
            success: !error,
            value: value,
            error: error || false,
        };

    },

    validateAny: function(test, json) {

        var result = null;

        ['jsonld', 'microdata', 'rdfa', 'metatags'].forEach(type => {
            if (result = this.validate(test, json[type])) {
                return result;
            }
        });

        return false;

    },

    // return error message if the value doesn't match expactation
    // returns false if value matches expactation
    compareWithExpectedValue: function(value, test) {

        var path = test.test;

        // If value is found and matches what we expect…
        // …or in the case of metadata, if the returned value is an array 
        // and one of the items matches what we expect then the test passes
        if (value == test.expect || (Array.isArray(value) && value.includes(test.expect))) {
            return false;
        }

        // If 'expect' is 'true' then a pathValue should exist.
        // If no value for expect then assume is a simple check to see it exists.
        // Note: It's okay if the value is zero, or false but it should not be empty!
        if ( (test.expect === true)
          && (value !== 0 && value !== false && (!value || value.length === 0)) ) {

            return {
                type: 'MISSING_PROPERTY',
                message: `Could not find "${path}"`,
            };
        }

        // If 'expect' is 'false' then a pathValue SHOULD NOT exist
        if (value !== null && test.expect === false) {
            return {
                type: 'PROPERTY_SHOULD_NOT_EXIST',
                message: `The property "${path}" should not be defined`,
            };
        }

        // If test is a Regular Expression…
        if (value && test.expect instanceof RegExp) {

            if ( (Array.isArray(value) && value.some(v => { return v.match(test.expect); }))
              || (typeof value == 'string' && value.match(test.expect)) ) {

                return {
                    type: 'REGEXP_FAILED',
                    message: `Failed RegExp test for "${path}"`,
                    expected: test.expect.toString(),
                    found: value
                };
            }
            else {
                return false;
            }

        }

console.log('end of expect and still no error returned', value, test);

        return {
            type: 'INCORRECT_VALUE',
            message: `Incorrect value for "${path}"`,
            expected: test.expect,
            found: value
        };

    },

    formatResponse: function(result, test) {

        if (!result) {
            this.response.failed.push(test);
            return;
        }

        if (result.success) {

            this.response.passed.push(test);

        } else if (result.error) {

            if (test.optional) {
                this.response.optional.push(test);
            }
            else if (test.warning) {
                this.response.warnings.push(test);
            }
            else {
                this.response.failed.push(test);
            }

        }

    },

    addMetaTagsToTests: function(data) {

        // seems a bit useless, too...
return;

        data = data || this.data;

        var metatags = {};

        Object.keys(data.metatags).map(tag => {
            if (tag !== 'undefined') metatags[tag] = data.metatags[tag];
        });

        if (Object.keys(metatags).length > 0) {
            Object.keys(metatags).map(tag => {
                this.tests.push({
                    test: `"${tag}"`,
                    type: 'metatag',
                    group: 'Metatags',
                    description: tag,
                    optional: true
                });
            });
        }

    },

    addSchemasToTests: function(data) {

        data = data || this.data;
/* 
        var schemas = [];

        // auto detect schemas --> useless without validation
        ['rdfa', 'microdata', 'jsonld'].forEach(type => {
            Object.keys(data[type]).map(schema => {
                if (schema !== 'undefined' && !schemas.includes(schema)) {
                    schemas.push(`${type}:${schema}`);
                }
            });
        });

        this.schemas = this.schemas.concat(schemas);
 */
        // add schemas to tests
        this.schemas.forEach((schema) => {

            var type,
                name = schema,
                index = 0, // to do...
                groups = ['Schema.org']; // to do ...

            if (name.indexOf(':') != -1) {
                var split = name.split(':');
                type = split[0];
                name = split[1];
            }

            this.tests.push({
                test: `${name}[${index}]`, // to do: multiple instances...
                schema: name,
                type: type || 'any',
                group: name,
                groups: groups,
                description: type ? `schema in ${type}` : `schema found`
            });

            if (type && this.schemaDefinitions.hasOwnProperty(name)) {

                this.addSchemaPropertiesToTests(name, type, schema, index);

            }

        });

    },

    addSchemaPropertiesToTests(name, type, schema, index) {

        // adding the tests from core structured-data-testing-tool is useless
        // it has no effect, other than checking existence against existing data
        // a real validation would be useful, but there is only a comment
        // "@TODO Add test to check if prop contents is valid"
// return;

        if (this.data[type].hasOwnProperty(name)) {

console.log(this.data[type][name]);

            this.data[type][name].forEach(prop => {

                if (prop.hasOwnProperty('@type')) {
                    var schemaType = prop['@type'];
console.log(schemaType);
                }

            });

        }

    },

    addPresetsToTests(presets) {

        presets = presets || this.presets;

        presets.forEach(preset => {

            // different from sdtt behaviour
            if (typeof preset == 'string') {

                if (this.defaultPresets[preset]) {
                    preset = this.defaultPresets[preset];
                } else {
                    throw new Error(`Invalid preset specified`)
                }

            }

            if (!preset) {
                throw new Error(`Invalid preset specified`)
            }

            if (!preset.name) {
                throw new Error(`Preset specified does not have a 'name' (required)`)
            }

            if (preset.tests && Array.isArray(preset.tests)) {

                if (preset.schema) {

                    ['microdata', 'rdfa', 'jsonld'].forEach(dataType => {
 
                        Object.keys(this.data[dataType]).map(schemaName => {

                            if (schemaName == preset.schema) {

                                var skipTest = false;

                                if (preset.conditional) {
                                    skipTest = this.runSingleTest(preset.conditional);
                                }

                                if (!skipTest || !skipTest.error) {

                                    this.data[dataType][schemaName].forEach((instance, i) => {

                                        preset.tests.forEach(test => {

                                            var schemaTest = Object.assign({}, test, {
                                                schema: preset.schema,
                                                test: test.test.replace(/(.*)?\[\*\]/, `${preset.schema}[${i}]`),
                                                type: dataType,
                                                group: `#${i} (${dataType})`,
                                                groups: [], // to do...
                                            });

                                            schemaTest.description = schemaTest.description || schemaTest.test.replace(/(.*)?\[\d\]\./, '').replace(/"/g, '');

                                            this.tests.push(schemaTest);

                                        });

                                    });

                                }

                            }

                        });

                    });

                }

                else {

                    if (preset.conditional) {

                        var skipTest = this.runSingleTest(preset.conditional);

                        if (!skipTest || !skipTest.error) {

                            preset.tests.forEach(test => {

                                test.group = preset.group || preset.name;
                                this.tests.push(test);

                            });
                        } 
                    }

                    else {
                        preset.tests.forEach(test => {

                            test.group = preset.group || preset.name;
                            this.tests.push(test);

                        });
                    }

                }

            }

            if (preset.hasOwnProperty('presets') && Array.isArray(preset.presets) && preset.presets.length) {

                this.addPresetsToTests(preset.presets);

            }

        });

    },

    flush() {

        this.data =    {};
        this.tests =   [];
        this.presets = [];
        this.schemas = [];

        this.response = {
            passed:   [],
            failed:   [],
            warnings: [],
            optional: [],
            skipped:  [],
        };

    },

    getResponse() {

        return {
            tests: this.tests,
            passed: this.response.passed,
            failed: this.response.failed,
            warnings: this.response.warnings,
            optional: this.response.optional,
            skipped: this.response.skipped,
            groups: [], // to do...
            schemas: this.schemas,
            data: this.data,
            options: {},
        };

    },

/* 
    // https://github.com/glitchdigital/structured-data-testing-tool/issues/4
    fixWhiteSpacedMicroData: function(data) {
        
        // not needed anymore ??? --> should be fixed in parser

        if (!data.microdata || typeof data.microdata != 'object') return data;

        let result = data;
        Object.keys(result.microdata).forEach(schema => {
            result.microdata[schema].forEach(object => {
                Object.keys(object).forEach(key => {
                    if (key.includes(' ')) {
                        key.split(' ').forEach(newKey => {
                            object[newKey] = object[key]
                        });
                        delete object[key]
                    }
                });
            });
        });
        return result;

    },
 */

});

module.exports = App;
