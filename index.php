<?php
if (!file_exists(__DIR__ . '/ui/lib/cockpit/bootstrap.php')) {
    echo 'Cockpit CMS is not installed.';
    die;
}

include(__DIR__ . '/ui/bootstrap.php');

$testUrls = [];
foreach (cockpit()('fs')->ls('*.html', __DIR__ . '/test') as $file) {
    $testUrls[$file->getBasename('.'.$file->getExtension())] = '/test/'.$file->getFilename();
}

?>
<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>SEO Meta Validator</title>
        <link rel="stylesheet" type="text/css" href="dist/metavalidator.min.css" id="metavalidator-style" />
        <style>
            html {
                font-family: system-ui, Helvetica, sans-serif;
            }
        </style>
    </head>
    <body>

        <a href="http://localhost/seo-meta-validator/ui" style="float:right">Login</a>

        <h1>SEO Meta Validator</h1>

        <p>Enter a url, select a preset and click the button to run the tests. It works well on localhost, but the requests fail for external urls (CORS).</p>

        <script src="dist/metavalidator.min.js" id="metavalidator-script"></script>
        <script>

            var url = '/test/example.html';

            var options = {
                autodetect: true,
                //presets: ['Default', 'Google'],
                //presets: ['Default', 'SEO', 'Google', 'Twitter', 'Facebook'],
            };

            MetaValidator.testUrls = <?php echo json_encode($testUrls); ?>;

            MetaValidator.run(url, options);

        </script>
    </body>
</html>
