
const jmespath      = require('jmespath');
const presets       = require('./presets.js');
const MetaExtractor = require('./MetaExtractor.js');

const defaultPresets = Object.assign({
    Default: {name: 'Default', presets: ['SEO', 'Google']}
}, presets)


module.exports = {

    schemaOrgSchemas: {},
    schemaOrgProperties: {},

    MetaExtractor: MetaExtractor,
    jmespath: jmespath,

    defaultPresets: defaultPresets,

    dataTypes: [
        'Date',
        'DateTime',
        'Text',
        'Integer',
        'URL',
        'Boolean',
    ],

    url: '',
    data: {},

    tests:   [],
    presets: [],
    schemas: [],

    // helper to avoid adding the same preset test multiple times
    presetsInUse: [],

    autodetect: false,

    response: {
        passed:   [],
        failed:   [],
        warnings: [],
        optional: [],
        skipped:  [], // to do...
    },

    init: function (options) {

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

    run: async function (url, options) {

        // preload schema data from api or from localStorage
        if (Object.keys(this.schemaOrgSchemas).length == 0) {
            this.preloadSchemaOrgData(() => {
                this.run(url, options);
            });
            return;
        }

        url = url || this.url;

        this.url = url;

        this.init(options);

        var html = options && options.html ? options.html
                  : await this.fetchUrl(url, null, 'html')
                      .catch (e => { console.log(e); });

        if (typeof html == 'string') {
            this.MetaExtractor.html = this.HTMLParser.parse(html);
        } else if (typeof html == 'object' && html.constructor.name == 'HTMLDocument') {
            this.MetaExtractor.html = html;
        } else {
            console.log('unexpected html format');
        }

        this.data = this.MetaExtractor.extract();
        
        // reformat some short hand properties, that should be child schemas
        // to do: cleaner implementation
        this.data = this.lazyReformatSomePropertyStringsToObjects();

        if (this.autodetect) {
            this.addAutoDetectedTests();
        }

        this.addPresetsToTests();

        this.addSchemasToTests();

        this.runTests();

        this.trigger('finished');

    },

    runTests: function (data) {

        data = data || this.data;

        this.tests.forEach(test => {

            test.type = test.type || 'any';
            // to do: group

            var result = this.runSingleTest(test);

            if (result.if) {
                test.if.group = test.group;
                test = test.if;
            }

            this.formatResponse(result, test);

        });

    },

    runSingleTest: function (test, data) {

        // avoid running the same test multiple times
        if (test.result) {
            return test.result;
        }

        data = data || this.data;

        test.type = test.type || 'any';

        if (test.if) {

            var conditionalResult = this.runSingleTest(test.if, data);

            if (!conditionalResult || conditionalResult.error) {
                conditionalResult.if = test.if;
                return conditionalResult;
            }

        }

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

    validate: function (test, json) {

        if (!test || !json || !test.test) return false;

        var error,
            warning,
            success = null,
            path  = test.test,
            value = this.jmespath.search(json, path);

        if (test.schema && test.property) {

            // compare allowed properties

            var properties = this.getSchemaOrgSchemaProperties(test.schema);

            var isPropertyAllowed = false,
                isPropertyPending = false;

            if (properties && Array.isArray(properties)) {

                isPropertyAllowed = properties.includes(test.property);

            }

            if (this.schemaOrgProperties[test.property]
              && this.schemaOrgProperties[test.property].domainIncludes
              && Array.isArray(this.schemaOrgProperties[test.property].domainIncludes)) {

                if (this.schemaOrgProperties[test.property].domainIncludes.includes(test.schema)) {

                    if (this.schemaOrgProperties[test.property].pending) {
                        isPropertyPending = true;
                    }

                    isPropertyAllowed = true;

                }

            }

            if (!isPropertyAllowed && !isPropertyPending) {
                error = {
                    type: 'PROPERTY_NOT_ALLOWED',
                    message: `Property is not allowed in schema ${test.schema}`
                };
            }

            if (isPropertyPending) {
                warning = {
                    type: 'PROPERTY_IS_PENDING',
                    message: 'Property is pending'
                };
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
                    message: 'Data type is not allowed in schema property'
                }
            }

            if (rangeValidation === null) {
                success = true;
                warning = {
                    type: 'MAYBE_INVALID_SCHEMA_PROPERTY',
                    message: 'No data type validator found.'
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
            success: success !== null ? success : !error,
            value: value,
            error: error || false,
            warning: warning || false,
        };

    },

    validateAny: function (test, json) {

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
    compareWithExpectedValue: function (value, test) {

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

            if ( (Array.isArray(value) && !value.some(v => { return v.match(test.expect); }))
              || (typeof value == 'string' && !value.match(test.expect)) ) {

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

// console.log('end of expect and still no error returned', value, test);

        return {
            type: 'INCORRECT_VALUE',
            message: `Incorrect value for "${path}"`,
            expected: test.expect,
            found: value
        };

    },

    formatResponse: function (result, test) {

        if (!result) {
            this.response.failed.push(test);
            return;
        }

        if (result.success) {

            this.response.passed.push(Object.assign({result:result},test));

        } else if (result.error) {

            if (test.optional) {
                this.response.optional.push(Object.assign({result:result},test));
            }
            else if (test.warning) {
                this.response.warnings.push(Object.assign({result:result},test));
            }
            else {
                this.response.failed.push(Object.assign({result:result},test));
            }

        }

    },

    addAutoDetectedTests: function (data) {

        data = data || this.data;

        // disabled for debugging and because there is no real validation
        // this.addMetaTagsToTests();

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

    addMetaTagsToTests: function (data) {

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

    addSchemasToTests: function (data, schemas, opts = {}) {

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

                if (this.schemaOrgSchemas[name] && data[type][prop]) {

                    if (Array.isArray(data[type][prop])) {

                        data[type][prop].map( (dataSet, index) => {

                            var group = opts.group || `${name} #${index}`;

                            this.tests.push({
                                type:   type,
                                schema: name,
                                test:   (opts.parent ? `${opts.parent}.` : '') + `\"${prop}\"[${index}]`,
                                group:  group,
                                groups: groups,
                                description:  type ? `schema in ${type}` : `schema found`,
                                autoDetected: true
                            });

                            var options = {
                                type:       type,
                                schemaName: name,
                                index:      index,
                                group:      group,
                                parent:     `\"${name}\"[${index}]`
                            };

                            if (opts.parent) {
                                options.parent = `${opts.parent}.${options.parent}`;
                            }

                            this.addSchemaPropertiesToTests(dataSet, options);

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
                            parent:     `\"${prop}\"`
                        };

                        if (opts.parent) {
                            options.parent = `${opts.parent}.${options.parent}`;
                        }

                        this.addSchemaPropertiesToTests(data[type][prop], options);

                    }

                }

            }

        };

    },

    addSchemaPropertiesToTests: function (dataSet, options) {

        // recursive

        // add auto detected tests for schema.org properties
        // checks, if property is allowed in schema
        // partially checks, if property data type is valid

        var type       = options.type,
            schemaName = options.schemaName,
            index      = options.index,
            group      = options.group,
            parent     = options.parent;

        Object.keys(dataSet).map( prop => {

            if (prop && prop != 'undefined' && prop != '@type' && prop != '@context' && prop != '@id') {

                if (typeof dataSet[prop] == 'string' || typeof dataSet[prop] == 'number') {

                    var description = parent.split('.');
                    description.shift();
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

                    // to do...
                    // var rangeIncludes = this.getSchemaOrgPropertyRangeIncludes(prop);

                    var propertyDefinition = this.schemaOrgProperties[prop] || false;

                    if (propertyDefinition && propertyDefinition.rangeIncludes
                      && Array.isArray(propertyDefinition.rangeIncludes)) {

                        test.range = propertyDefinition.rangeIncludes;

                    }

                    if (!propertyDefinition) {
                        // to do...
// console.log('missing propertyDefinition', prop);
                    }

                    this.tests.push(test);

                }

                else if (Array.isArray(dataSet[prop])) {

                    dataSet[prop].map( (p, i) =>{

                        var opts = {
                            type:       type,
                            schemaName: schemaName,
                            index:      index,
                            group:      group,
                            parent:     `${parent}.\"${prop}\"[${i}]`
                        };

                        this.addSchemaPropertiesToTests(p, opts);

                    });

                }

                else if (typeof dataSet[prop] == 'object') {

                    if (dataSet[prop]['@type']) {

                        var childSchema = `${type}:${dataSet[prop]['@type']}`;

                        var childData = {
                            [type]: {
                                [prop]: dataSet[prop]
                            }
                        };

                        var opts = {
                            prop:   prop,
                            parent: parent,
                            group:  group,
                        };

                        this.addSchemasToTests(childData, [childSchema], opts);

                    }

                    else {

                        var opts = {
                            type:       type,
                            schemaName: schemaName,
                            index:      index,
                            group:      group,
                            parent:     `${parent}.${prop}`
                        };

                        this.addSchemaPropertiesToTests(dataSet[prop], opts);
                    }

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

            // skip preset if it is already in use
            if (!this.presetsInUse.includes(preset.name)) {
                this.presetsInUse.push(preset.name);
            } else { return; }

            if (preset.tests && Array.isArray(preset.tests)) {

                if (preset.schema) {

                    ['microdata', 'rdfa', 'jsonld'].forEach(dataType => {
 
                        Object.keys(this.data[dataType]).map(schemaName => {

                            if (schemaName == preset.schema) {

// add schemas from presets to schema tests, too???
// this.schemas.push(`${dataType}:${preset.schema}`);

                                var conditionalTestPassed = false;

                                if (preset.conditional) {
                                    conditionalTestPassed = this.runSingleTest(preset.conditional);
                                }

                                if (conditionalTestPassed && !conditionalTestPassed.error) return;

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
        this.presetsInUse = [];

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
                case 'URL':         return this.validator.isURL(value, {require_tld: false});           break;
                case 'Date':        // to do: different checks!!!
                case 'DateTime':    return this.validator.isISO8601(value);       break;
                case 'Text':        return typeof value === 'string';             break;
                case 'Integer':     return typeof value === 'number';             break;
            }

            rangeTestExists = false;

            return false;

        });

// if (!testPassed) console.log('validateSchemaOrgRange', value, test);

        return testPassed ? testPassed : (!rangeTestExists ? null : false);

    },

    getSchemaOrgSchemaProperties: function (schemaName) {

        // recursive
        // doesn't find pending properties

        if (!this.schemaOrgSchemas[schemaName]) return null;

        var properties = [];

        if (this.schemaOrgSchemas[schemaName].properties) {

            properties = properties.concat(this.schemaOrgSchemas[schemaName].properties);

        }

        // inherit properties from parent schema(s)

        if (this.schemaOrgSchemas[schemaName].subTypeOf
          && Array.isArray(this.schemaOrgSchemas[schemaName].subTypeOf)) {

            this.schemaOrgSchemas[schemaName].subTypeOf.map(e => {

                var inheritedProperties = this.getSchemaOrgSchemaProperties(e);

                if (inheritedProperties) {
                    properties = properties.concat(inheritedProperties);
                }

            });

        }

        return properties.length ? properties : false;

    },

    // to do...
    // getSchemaOrgPropertyRangeIncludes: function (propertyName) {

        // if (!this.schemaOrgProperties[propertyName]) return null;

        // if (this.schemaOrgProperties[propertyName].rangeIncludes) {

// console.log(propertyName, this.schemaOrgProperties[propertyName].rangeIncludes);

        // }

    // },

    lazyReformatSomePropertyStringsToObjects: function (data) {

        data = data || this.data;

        Object.keys(data).forEach(type => {

            if (!['jsonld', 'microdata', 'rdfa'].includes(type)) {
                return;
            }

            Object.keys(data[type]).forEach(key => {

                data[type][key].forEach(d => {

                    Object.keys(d).forEach(k => {

                        if (k == '@context' || k == '@type') return;

                        var propertySchema = this.schemaOrgProperties[k] || false;

                        if (propertySchema && propertySchema.rangeIncludes) {

                            var shouldBeObject = !propertySchema.rangeIncludes.some(e => {
                                return this.dataTypes.includes(e);
                            });

                            if (typeof d[k] == 'string' && shouldBeObject) {

                                // default value to name
                                // to do: check, if it is a Thing or something else and if the property name is allowed 

                                d[k] = {
                                    '@type': 'Thing',
                                    '@context': d['@context'],
                                    'name': d[k]
                                };

                            }

                        }

                    });

                });

            });

        });

        return data;

    },


    /**
     * Event system from Cockpit CMS - app.js (with minimal modification)
     * Cockpit CMS, (c) Artur Heinze, MIT License, https://github.com/agentejo/cockpit
     * source: https://github.com/agentejo/cockpit/blob/next/assets/app/js/app.js
     */

    _events: {},

    on: function (name, fn){
        if (!this._events[name]) this._events[name] = [];
        this._events[name].push(fn);
    },

    off: function (name, fn){
        if (!this._events[name]) return;

        if (!fn) {
           this._events[name] = [];
        } else {

            for (var i = 0; i < this._events[name].length; i++) {
                if (this._events[name][i]===fn) {
                    this._events[name].splice(i, 1);
                    break;
                }
            }
        }
    },

    trigger: function (name, params) {

        if (!this._events[name]) return;

        var event = {"name":name, "params": params};

        for (var i = 0; i < this._events[name].length; i++) {
            this._events[name][i].apply(this, [event]); // replaced `App` with `this`
        }
    },

};
