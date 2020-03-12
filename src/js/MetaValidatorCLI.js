
// temporary cli output on finish event

module.exports = function() {

    var instanceUrl = 'http://localhost/seo-meta-validator';

    // get response and create messages
    var response = this.getResponse();

    var groups = {
        ungrouped: []
    };

    // get list of groups
    response.tests.forEach(test => {
        if (test.group) {
            if (!groups[test.group]) groups[test.group] = [];
        }
    });

    // map responses to groups
    Object.keys(groups).forEach(group => {
        ['passed', 'warnings', 'failed'].forEach(responseType => {
            groups[group][responseType] = response[responseType]
                .filter(t => (t.group === group) || (!t.group && group == 'ungrouped'));
        });
    });

    var totalTests = response.passed.length + response.warnings.length + response.failed.length;

    console.log(`Url: ${this.url}`);
    console.log(`Number of Tests:    ${response.tests.length}`);
    console.log(`Number of Metatags: ${Object.keys(this.data.metatags).length || 0}`);
    console.log(`Schemas in JSON-LD: ${Object.keys(this.data.jsonld).length || 0}`);
    // ...


    console.log('');
    console.log(`Passed:   ${Math.floor((response.passed.length / totalTests) * 100) || 0}%`);
    console.log(`Warnings: ${Math.floor((response.warnings.length / totalTests) * 100) || 0}%`);
    console.log(`Failed:   ${Math.floor((response.failed.length / totalTests) * 100) || 0}%`);
    console.log(`Optional: ${response.optional.length}`);
    // ...


    Object.keys(groups).forEach(name => {

        var group = groups[name],
            total = group.passed.length + group.warnings.length + group.failed.length,
            percentPassed = Math.floor((group.passed.length / total) * 100) || 0;

        if (total) {

            console.log('');
            console.log(`${name} - ${percentPassed}% (${group.passed.length} passed, ${group.failed.length} failed`);

            ['passed', 'failed', 'warnings'].forEach(responseType => {

                response[responseType].forEach(test => {
                    if ((test.group == name) || (!test.group && name == 'ungrouped')) {

                        var icon = '';
                        switch (responseType) {
                            case 'passed':  icon = '✓'; break;
                            case 'failed':  icon = '✕'; break;
                            case 'warning': icon = '▲'; break;
                        }

                        console.log(`${icon} ${test.description || test.test}`);
                    }

                });

            });

        }

    });

};
