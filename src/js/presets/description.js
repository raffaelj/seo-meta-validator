
module.exports = {
    name: 'description',
    description: 'description length',
    group: 'SEO',
    conditional: {
        test: `"description"`,
        type: 'metatag',
    },
    tests: [
        {
            test: `"description"`,
            type: 'metatags',
            warning: true,
            expect: new RegExp('^.{45,320}$'),
            description: 'description must be 45 - 320 characters long'
        },
        {
            test: `"description"`,
            type: 'metatags',
            optional: true,
            expect: new RegExp('^.{80,160}$'),
            description: 'description should be 80 - 160 characters long'
        },
    ],
}
