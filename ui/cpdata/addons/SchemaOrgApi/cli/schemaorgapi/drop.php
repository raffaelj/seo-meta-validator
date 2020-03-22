<?php

if (!COCKPIT_CLI) return;

$collection = $app->param('collection', null);

if (!$collection) {
    CLI::writeln('Collection parameter missing', false);
    return;
}

$ret = $app->module('schemaorgapi')->dropCollection($collection);

CLI::writeln($ret['message'], true);
