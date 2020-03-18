
module.exports = {
    name: 'og:description',
    description: 'og:description length',
    group: 'SEO',
    conditional: {
        test: `"og:description"`,
        type: 'metatags',
    },
    tests: [
        {
            test: `"og:description"`,
            type: 'metatags',
            optional: true,
            expect: new RegExp('^.{80,200}$'),
            description: 'og:description should be 80 - 200 characters long',
            if: {
                test: `"og:description"`,
                type: 'metatags',
                warning: true,
                expect: new RegExp('^.{45,300}$'),
                description: 'og:description must be 45 - 300 characters long'
            },
        },
    ],
}
