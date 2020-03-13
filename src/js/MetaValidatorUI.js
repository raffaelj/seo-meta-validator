
// temporary, quick and dirty output/mini ui on finish event

module.exports = function() {

    // MetaValidator instance
    var $this = this;

    var script      = document.getElementById('metavalidator-script'),
        instanceUrl = script.src.replace(/\/metavalidator.min.js/, '');

    // load styles
    var link = document.getElementById('metavalidator-style');
    if (!link) {
        link      = document.createElement('link');
        link.type = 'text/css';
        link.rel  = 'stylesheet';
        link.href = instanceUrl + '/metavalidator.min.css';
        link.id   = 'metavalidator-style';
        document.head.appendChild(link);
    }

    // create container with ui form and messages
    var container = document.getElementById('metavalidator-container');
    if (!container) {
        container = document.createElement('div');
        container.setAttribute('id', 'metavalidator-container');

        if (this.url == window.location) {
            container.setAttribute('class', 'metavalidator-overlay');
        }

        document.body.appendChild(container);
    }

    var sizeToggle = document.getElementById('metavalidator-size-toggle');
    if (!sizeToggle) {
        var sizeToggle = document.createElement('a');
        sizeToggle.setAttribute('id', 'metavalidator-size-toggle');
        sizeToggle.setAttribute('title', 'reszize MetaValidator');
        sizeToggle.addEventListener('click', function(e) {
            if (e) e.preventDefault();
            container.classList.toggle('full-width');
        });
        container.appendChild(sizeToggle);
    }

    var displayToggle = document.getElementById('metavalidator-display-toggle');
    if (!displayToggle) {
        var displayToggle = document.createElement('a');
        displayToggle.setAttribute('id', 'metavalidator-display-toggle');
        displayToggle.setAttribute('title', 'display/hide MetaValidator');
        displayToggle.addEventListener('click', function(e) {
            if (e) e.preventDefault();
            container.classList.toggle('collapsed');
        });
        container.appendChild(displayToggle);
    }
    
    var form = document.getElementById('metavalidator-form');
    if (!form) {
        form = document.createElement('form');
        form.setAttribute('id', 'metavalidator-form');

        form.addEventListener('submit', (e) => {
            if (e) e.preventDefault();

            var url = '',
                options = {presets:[]},
                data = new FormData(form);

            var entries = data.entries(), entry = entries.next();
            while (!entry.done) {

                if (entry.value[0] == 'url') url = entry.value[1];
                if (entry.value[0] == 'presets[]') options.presets.push(entry.value[1]);

                entry = entries.next();
            }

            this.run(url, options);
        });

        if (this.url != window.location) {
            var urlInput   = document.createElement('input');
            urlInput.id    = 'metavalidator-url';
            urlInput.type  = 'text';
            urlInput.name  = 'url';
            urlInput.value = this.url;
            form.appendChild(urlInput);
        }

        var selected = Object.keys(this.presets).map(e => {return this.presets[e].name});

        var presetFieldset = document.createElement('fieldset');
        presetFieldset.appendChild(document.createTextNode('Presets: '));
        Object.keys(this.defaultPresets).forEach(preset => {

            var name         = this.defaultPresets[preset].name;
            var checkbox     = document.createElement('input');
            checkbox.type    = 'checkbox';
            checkbox.name    = `presets[]`;
            checkbox.value   = name;
            checkbox.id      = 'metavalidator-preset-' + name;
            checkbox.checked = selected.indexOf(name) != -1;

            var label    = document.createElement('label');
            label.setAttribute('for', 'metavalidator-preset-' + name);
            label.innerText = name;
            
            // set title with containing presets
            if (this.defaultPresets[preset].presets) {

                var labelTitle = [];
                this.defaultPresets[preset].presets.forEach(p => {
                    labelTitle.push(typeof p == 'string' ? p : p.name);
                });
                label.title = labelTitle.join(', ');
            }

            presetFieldset.appendChild(checkbox);
            presetFieldset.appendChild(label);

        });

        var submitButton = document.createElement('button');
        submitButton.setAttribute('type', 'submit');
        submitButton.innerText = 'Run test';

        form.appendChild(presetFieldset);
        form.appendChild(submitButton);

        container.appendChild(form);
    }

    var infoContainer = document.getElementById('metavalidator-info-container');
    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.setAttribute('id', 'metavalidator-info-container');
        container.appendChild(infoContainer);
    }

    
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

    // flush container
    infoContainer.innerHTML = '';

    var output = '';
    var totalTests = response.passed.length + response.warnings.length + response.failed.length;


    output += '<div>';

    output += `<p><b>Url:</b> ${this.url}</p>`;
    output += '<p>Number of Tests: '    + (response.tests.length) + '</p>';
    output += '<p>Number of Metatags: ' + (Object.keys(this.data.metatags).length || 0) + '</p>';
    output += '<p>Schemas in JSON-LD: ' + (Object.keys(this.data.jsonld).length || 0) + '</p>';
    // ...


    output += '<p>Passed: '   + (Math.floor((response.passed.length / totalTests) * 100) || 0) + '%</p>';
    output += '<p>Warnings: ' + (Math.floor((response.warnings.length / totalTests) * 100) || 0) + '%</p>';
    output += '<p>Failed: '   + (Math.floor((response.failed.length / totalTests) * 100) || 0) + '%</p>';
    output += '<p>Optional: ' + response.optional.length + '</p>';

    output += '</div>';


    Object.keys(groups).forEach(name => {

        var group = groups[name],
            total = group.passed.length + group.warnings.length + group.failed.length,
            percentPassed = Math.floor((group.passed.length / total) * 100) || 0;

        if (total) {
            output += '<div>';
            output += `<p><b>${name}</b> - ${percentPassed}% (${group.passed.length} passed, ${group.failed.length} failed, </p>`;

            ['passed', 'failed', 'warnings'].forEach(responseType => {
                output += `<ul>`;

                response[responseType].forEach(test => {
                    if ((test.group == name) || (!test.group && name == 'ungrouped')) {
                        output += `<li class="metavalidator-${responseType}">${test.description || test.test}</li>`;
                    }

                });

                output += `</ul>`;
            });

            output += '</div>';
        }

    });

    // print response as json
    // output += '<div>';
    // output += '<pre>' + JSON.stringify(response, null, 2) + '</pre>';
    // output += '<pre>' + JSON.stringify(response.tests, null, 2) + '</pre>';
    // output += '</div>';

    infoContainer.innerHTML = output;

};
