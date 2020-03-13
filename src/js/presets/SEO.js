
const title       = require('./title.js');
const description = require('./description.js');

module.exports = {
    name: 'SEO',
    description: '',
    tests: [
        {
            test: `"title"`,
            type: 'htmltags',
            description: 'must have title'
        },
        {
            test: `"description"`,
            type: 'metatag',
            description: 'must have description'
        },
    ],
    presets: [
        title,
        description
    ],
};



/*
var definitions = {
    'title': {
        'min': 25,
        'good_min': 35,
        'good_max': 65,
        'max': 75,
    },
    'description': {
        'min': 45,
        'good_min': 80,
        'good_max': 160,
        'max': 320,
    },
    'og.0.title': {
        'min': 15,
        'good_min': 25,
        'good_max': 88,
        'max': 100,
    },
    'og.1.description': {
        'min': 45,
        'good_min': 80,
        'good_max': 200,
        'max': 300,
    },
    'twitter.title': {
        'min': 15,
        'good_min': 25,
        'good_max': 69,
        'max': 70,
    },
    'twitter.description': {
        'min': 45,
        'good_min': 80,
        'good_max': 200,
        'max': 200,
    },
};
*/
