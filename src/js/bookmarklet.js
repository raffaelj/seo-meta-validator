
var script = document.getElementById('metavalidator-script');
if (!script) {
    script     = document.createElement('script');
    script.id  = 'metavalidator-script';
    script.src = 'http://localhost/seo-meta-validator/dist/metavalidator.min.js';
    document.head.appendChild(script);
}

// to do: wait until script is loaded and MetaValidator is available
// for now a simple delay of 1 second seems to be enough...
window.setTimeout(function() {
    MetaValidator.run();
}, 1000);
