
module.exports = {
    name: 'twitter:description',
    description: 'twitter:description length',
    group: 'SEO',
    conditional: {
        test: `"twitter:description"`,
        type: 'metatags',
    },
    tests: [
        {
            test: `"twitter:description"`,
            type: 'metatags',
            optional: true,
            expect: new RegExp('^.{80,200}$'),
            description: 'twitter:description should be 80 - 200 characters long',
            if: {
                test: `"twitter:description"`,
                type: 'metatags',
                warning: true,
                expect: new RegExp('^.{45,200}$'),
                description: 'twitter:description must be 45 - 200 characters long'
            },
        },
    ],
}
