<?php

if (!COCKPIT_CLI) return;

$time = time();

$fileName   = 'all-layers.jsonld';

$return = $app->module('schemaorgapi')->import($fileName);

$seconds = time() - $time;

CLI::writeln("Done importing in $seconds seconds.", true);
