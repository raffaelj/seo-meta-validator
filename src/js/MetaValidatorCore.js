
const jmespath      = require('jmespath');
const presets       = require('./presets.js');
const MetaExtractor = require('./MetaExtractor.js');

const defaultPresets = Object.assign({
    Default: {name: 'Default', presets: ['SEO', 'Google']}
}, presets)


module.exports = {

    url: '',

    MetaExtractor:     MetaExtractor,
    schemaValidator:   jmespath,

    defaultPresets:    defaultPresets,

    data:    {},

    tests:   [],
    presets: [],
    schemas: [],

    autodetect: false,

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

        if (options && typeof options == 'object') {

            this.autodetect = options.autodetect || false;

            if (options.tests && Array.isArray(options.tests)) {
                this.tests = this.tests.concat(options.tests);
            }

            if (options.presets && Array.isArray(options.presets)) {
                this.presets = this.presets.concat(options.presets);
            }

            if (options.schemas && Array.isArray(options.schemas)) {
                this.schemas = this.schemas.concat(options.schemas);
            }

        }

        if (!this.autodetect && !this.tests.length
          && !this.presets.length && !this.schemas.length) {

            this.presets.push(this.defaultPresets.Default);
        }

    },

    run: async function(url, options) {

        url = url || this.url;

        this.url = url;

        this.init(options);

        var html = options && options.html ? options.html
                   : await this.fetchUrl(url, null, 'html');

        this.MetaExtractor.html = this.HTMLParser.parse(html);

        this.data = this.MetaExtractor.extract();

        if (this.autodetect) {
            this.addAutoDetectedTests();
        }

        this.addPresetsToTests();

        await this.addSchemasToTests();

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

        if (test.schema && test.property) {

            // compare allowed properties
            if (this.schemaOrgDefinitions[test.schema].properties
              && Array.isArray(this.schemaOrgDefinitions[test.schema].properties)) {

                var isPropertyAllowed = this.schemaOrgDefinitions[test.schema].properties.includes(test.property);
 
                if (!isPropertyAllowed) {
                    error = {
                        type: 'PROPERTY_NOT_ALLOWED',
                        message: 'Property is not allowed in schema'
                    };
                }

            }

        }

        if (test.schema && test.range) {

            // returns null if no schema content type validator found
            // returns true/false if the content type validation passes/fails
            rangeValidation = this.validateSchemaOrgRange(value, test);

// console.log(rangeValidation, value, test.type, test.schema, test.range);

            if (rangeValidation === false) {
                error = {
                    type: 'INVALID_SCHEMA_PROPERTY',
                    message: 'Content type is not allowed in schema property'
                }
            }

        }

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
                // this.response.optional.push(test);
                this.response.optional.push(Object.assign(result,test));
            }
            else if (test.warning) {
                // this.response.warnings.push(test);
                this.response.warnings.push(Object.assign(result,test));
            }
            else {
                // this.response.failed.push(test);
                this.response.failed.push(Object.assign(result,test));
            }

        }

    },

    addAutoDetectedTests: function (data) {

        data = data || this.data;

        // disabled for debugging
        this.addMetaTagsToTests();

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

    },

    addMetaTagsToTests: function(data) {

        // seems to be useless - only a self test on existing data

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
                    optional: true,
                    autoDetected: true
                });
            });
        }

    },

    addSchemasToTests: async function(data, schemas, opts = {}) {

        // recursive

        data    = data    || this.data;
        schemas = schemas || this.schemas;

        // add schemas to tests
        for (schema of schemas) {

            var type,
                name = schema,
                groups = ['Schema.org']; // to do ...

            if (name.indexOf(':') != -1) {
                var split = name.split(':');
                type = split[0];
                name = split[1];
            }

            var prop = opts.prop || name;

            if (type) {

                var schemaDefinition = await this.getSchemaOrgSchema(name);

                if (schemaDefinition && data[type][prop]) {

                    if (Array.isArray(data[type][prop])) {
                        data[type][prop].map(async (dataSet, index) => {

                            var group = opts.group || `${name} #${index}`;

                            this.tests.push({
                                type:   type,
                                schema: name,
                                test:   (opts.parent ? `${opts.parent}.` : '') + `${prop}[${index}]`,
                                group: group,
                                groups: groups,
                                description:  type ? `schema in ${type}` : `schema found`,
                                autoDetected: true
                            });

                            var options = {
                                type:       type,
                                schemaName: name,
                                index:      index,
                                group:      group,
                                parent:     `${name}[${index}]`
                            };

                            if (opts.parent) {
                                options.parent = `${opts.parent}.${options.parent}`;
                            }

                            await this.addSchemaPropertiesToTests(dataSet, options);

                        });
                    }

                    else if (typeof data[type][prop] == 'object') {

                        var index = 0;
                        var group = opts.group || `${name} #${index}`;

                        var options = {
                            type:       type,
                            schemaName: name,
                            index:      index,
                            group:      group,
                            parent:     `${prop}`
                        };

                        if (opts.parent) {
                            options.parent = `${opts.parent}.${options.parent}`;
                        }

                        await this.addSchemaPropertiesToTests(data[type][prop], options);

                    }

                }

            }

        };

    },

    addSchemaPropertiesToTests: async function (dataSet, options) {

        // recursive

        // add auto detected tests for schema.org properties
        // checks, if property is allowed in schema
        // doesn't check, if property has valid contents

        var type       = options.type,
            schemaName = options.schemaName,
            index      = options.index,
            group      = options.group,
            parent     = options.parent;

        Object.keys(dataSet).map(async prop => {

            if (prop && prop != 'undefined' && prop != '@type' && prop != '@context') {

                if (typeof dataSet[prop] == 'string') {

                    var description = parent.split('.');
                    description.shift()
                    description = description.join('.');
                    description = description + (description.length ? '.' : '')  + prop;

                    var test = {
                        type:     type,
                        schema:   schemaName,
                        test:     `${parent}.\"${prop}\"`,
                        group:    group,
                        property: prop,
                        description: description,
                        autoDetected: true,
                    }

                    var propertyDefinition = await this.getSchemaOrgProperty(prop);

                    if (propertyDefinition && propertyDefinition.rangeIncludes
                      && Array.isArray(propertyDefinition.rangeIncludes)) {

                        test.range = propertyDefinition.rangeIncludes;

                    }

                    this.tests.push(test);

                }

                else if (typeof dataSet[prop] == 'object') {

                    var childSchema = `${type}:${dataSet[prop]['@type']}`;

                    var childData = {
                        [type]: {
                            [prop]: dataSet[prop]
                        }
                    };

                    var opts = {
                        parentPrefix: `${schemaName}[${index}].`,
                        prop: prop,
                        parent: parent,
                        group: group,
                    };

                    await this.addSchemasToTests(childData, [childSchema], opts);

                }

            }

        });

    },

    addPresetsToTests: function (presets, opts = {}) {

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

// add schemas from presets to schema tests, too???
// this.schemas.push(`${dataType}:${preset.schema}`);

                                var testPassed = false;

                                if (preset.conditional) {
                                    testPassed = this.runSingleTest(preset.conditional);
                                }

                                if (testPassed && !testPassed.error) return;

                                this.data[dataType][schemaName].forEach((instance, i) => {

                                    preset.tests.forEach(test => {

                                        var schemaTest = Object.assign({}, test, {
                                            schema: preset.schema,
                                            test: test.test.replace(/(.*)?\[\*\]/, `${preset.schema}[${i}]`),
                                            type: dataType,
                                            group: (opts.parent ? `${opts.parent} > ` :'') + `${schemaName} > #${i} (${dataType})`,
                                            groups: [], // to do...
                                        });

                                        schemaTest.description = schemaTest.description || schemaTest.test.replace(/(.*)?\[\d\]\./, '').replace(/"/g, '');

                                        this.tests.push(schemaTest);

                                    });

                                });

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

                this.addPresetsToTests(preset.presets, {parent: preset.name});

            }

        });

    },

    flush: function () {

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

    getResponse: function () {

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

    validateSchemaOrgRange: function (value, test) {

        var rangeTestExists = true;

        var testPassed = test.range.some(range => {

            switch (range) {
                case 'URL':         return this.validator.isURL(value);           break;
                case 'Date':        // to do: different checks!!!
                case 'DateTime':    return this.validator.isISO8601(value);       break;
                case 'Text':        return typeof value === 'string';             break;
            }

            rangeTestExists = false;

            return false;

        });

        return testPassed ? testPassed : (!rangeTestExists ? null : false);

    },


    /**
     * Event system from Cockpit CMS - app.js (with minimal modification)
     * Cockpit CMS, (c) Artur Heinze, MIT License, https://github.com/agentejo/cockpit
     * source: https://github.com/agentejo/cockpit/blob/next/assets/app/js/app.js
     */

    _events: {},

    on: function(name, fn){
        if (!this._events[name]) this._events[name] = [];
        this._events[name].push(fn);
    },

    off: function(name, fn){
        if (!this._events[name]) return;

        if (!fn) {
           this._events[name] = [];
        } else {

            for (var i=0; i < this._events[name].length; i++) {
                if (this._events[name][i]===fn) {
                    this._events[name].splice(i, 1);
                    break;
                }
            }
        }
    },

    trigger: function(name, params) {

        if (!this._events[name]) return;

        var event = {"name":name, "params": params};

        for (var i=0; i < this._events[name].length; i++) {
            this._events[name][i].apply(this, [event]); // replaced `App` with `this`
        }
    },

};
