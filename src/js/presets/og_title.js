
module.exports = {
    name: 'og:title',
    description: 'og:title length',
    group: 'SEO',
    conditional: {
        test: `"og:title"`,
        type: 'metatags',
    },
    tests: [
        {
            test: `"og:title"`,
            type: 'metatags',
            optional: true,
            expect: new RegExp('^.{25,88}$'),
            description: 'og:title should be 25 - 88 characters long',
            if: {
                test: `"og:title"`,
                type: 'metatags',
                warning: true,
                expect: new RegExp('^.{15,100}$'),
                description: 'og:title must be 15 - 100 characters long'
            },
        },
    ],
}
