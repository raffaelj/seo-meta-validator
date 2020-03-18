
module.exports = {
    name: 'twitter:title',
    description: 'twitter:title length',
    group: 'SEO',
    conditional: {
        test: `"twitter:title"`,
        type: 'metatags',
    },
    tests: [
        {
            test: `"twitter:title"`,
            type: 'metatags',
            optional: true,
            expect: new RegExp('^.{25,69}$'),
            description: 'twitter:title should be 25 - 69 characters long',
            if: {
                test: `"twitter:title"`,
                type: 'metatags',
                warning: true,
                expect: new RegExp('^.{15,70}$'),
                description: 'twitter:title must be 15 - 70 characters long'
            },
        },
    ],
}
