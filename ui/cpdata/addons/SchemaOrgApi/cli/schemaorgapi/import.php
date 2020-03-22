<?php

if (!COCKPIT_CLI) return;

$return = $app->module('schemaorgapi')->importCSV('schema_types', 'schema-types.csv');

if (isset($return['message'])) {
    CLI::writeln($return['message'], true);
} else if (isset($return['error'])) {
    CLI::writeln($return['error'], false);
}

$return = $app->module('schemaorgapi')->importCSV('schema_types', 'ext-pending-types.csv', true);

if (isset($return['message'])) {
    CLI::writeln($return['message'], true);
} else if (isset($return['error'])) {
    CLI::writeln($return['error'], false);
}

$return = $app->module('schemaorgapi')->importCSV('schema_properties', 'schema-properties.csv');

if (isset($return['message'])) {
    CLI::writeln($return['message'], true);
} else if (isset($return['error'])) {
    CLI::writeln($return['error'], false);
}

$return = $app->module('schemaorgapi')->importCSV('schema_properties', 'ext-pending-properties.csv', true);

if (isset($return['message'])) {
    CLI::writeln($return['message'], true);
} else if (isset($return['error'])) {
    CLI::writeln($return['error'], false);
}

CLI::writeln('Done.');
