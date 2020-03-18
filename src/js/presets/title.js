
module.exports = {
    name: 'title',
    description: 'title length',
    group: 'SEO',
    conditional: {
        test: `"title"`,
        type: 'htmltags',
    },
    tests: [
        {
            test: `"title"`,
            type: 'htmltags',
            optional: true,
            expect: new RegExp('^.{35,65}$'),
            description: 'title should be 35 - 65 characters long',
            if: {
                test: `"title"`,
                type: 'htmltags',
                warning: true,
                expect: new RegExp('^.{25,75}$'),
                description: 'title must be 25 - 75 characters long'
            },
        },
    ],
}
