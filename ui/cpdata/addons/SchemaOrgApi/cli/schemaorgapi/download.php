<?php

if (!COCKPIT_CLI) return;

$ret = $app->module('schemaorgapi')->downloadSchemas();

foreach ($ret as $fileName => $size) {
    CLI::writeln("Downloaded $fileName", true);
}
