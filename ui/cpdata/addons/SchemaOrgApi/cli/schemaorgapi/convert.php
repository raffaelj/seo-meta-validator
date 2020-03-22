<?php

if (!COCKPIT_CLI) return;

$types      = $app->param('types', false);
$properties = $app->param('properties', false);

if (!$types && !$properties) {
    CLI::writeln('types of properties parameter missing', false);
    return;
}

if ($types) {

    $time = time();

    $collection = 'schema_types';
    
    $count = $app->module('collections')->count($collection . '_linked');
    
    CLI::writeln("Start to convert $count entries - this may take a while...");

    $current = 0;
    for ($i = 0; $i <= $count; $i = $i + 50) {

        $chunkTime = time();

        $options = [
            'skip' => $i,
            'limit' => 50
        ];

        // convert collection
        $entries = $app->module('collections')->find($collection . '_linked', $options);
        $chunkCount = count($entries);

        foreach ($entries as &$entry) {

            $current++;

            // link types
            foreach (['subTypes', 'subTypeOf', 'enumerationtype'] as $fieldName) {

                if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                    $newLinkedSubTypes = [];

                    foreach ($entry[$fieldName] as $subType) {

                        if (is_string($subType)) {
                            $label = $subType;
                        } else if (is_array($subType) && isset($subType['display'])) {
                            $label = $subType['display'];
                        } else {
                            continue;
                        }

                        $filter = [
                            'label' => $label,
                        ];

                        $linkedEntry = $app->module('collections')->findOne($collection . '_linked', $filter);

                        if ($linkedEntry) {

                            $newLinkedSubTypes[] = [
                                '_id'     => $linkedEntry['_id'],
                                'link'    => $collection . '_linked',
                                'display' => $linkedEntry['label'],
                            ];

                        }

                    }

                    $entry[$fieldName] = $newLinkedSubTypes;

                }

            }
            
            // link properties --> too much collection links, performance issues
            // $fieldName = 'properties';
            // if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                // $newLinkedSubTypes = [];

                // foreach ($entry[$fieldName] as $subType) {

                    // if (is_string($subType)) {
                        // $label = $subType;
                    // } else if (is_array($subType) && isset($subType['display'])) {
                        // $label = $subType['display'];
                    // } else {
                        // continue;
                    // }

                    // $filter = [
                        // 'label' => $label,
                    // ];

                    // $linkedEntry = $app->module('collections')->findOne('schema_properties_linked', $filter);

                    // if ($linkedEntry) {

                        // $newLinkedSubTypes[] = [
                            // '_id'     => $linkedEntry['_id'],
                            // 'link'    => $collection . '_linked',
                            // 'display' => $linkedEntry['label'],
                        // ];

                    // }

                // }

                // $entry[$fieldName] = $newLinkedSubTypes;

            // }

            $app->module('collections')->save($collection . '_linked', $entry);

        }

        $chunkSeconds = time() - $chunkTime;

        CLI::writeln("Converted $chunkCount ($current/$count) entries in $chunkSeconds seconds");

    }

    $seconds = time() - $time;

    CLI::writeln("Done converting $count entries in $seconds seconds", true);

}


if ($properties) {

    $time = time();

    $collection = 'schema_properties';
    
    $count = $app->module('collections')->count($collection . '_linked');
    
    CLI::writeln("Start to convert $count entries - this may take a while...");

    $current = 0;
    for ($i = 0; $i <= $count; $i = $i + 50) {

        $chunkTime = time();

        $options = [
            'skip' => $i,
            'limit' => 50
        ];

        // convert collection
        $entries = $app->module('collections')->find($collection . '_linked', $options);
        $chunkCount = count($entries);

        foreach ($entries as &$entry) {

            $current++;

            // link to schema types
            foreach (['domainIncludes', 'rangeIncludes'] as $fieldName) {

                if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                    $newLinkedSubTypes = [];

                    foreach ($entry[$fieldName] as $subType) {

                        $filter = [
                            'id' => $subType,
                        ];

                        $linkedEntry = $app->module('collections')->findOne('schema_types_linked', $filter);
                        
                        if ($linkedEntry) {

                            $newLinkedSubTypes[] = [
                                '_id'     => $linkedEntry['_id'],
                                'link'    => 'schema_types_linked',
                                'display' => $linkedEntry['id'],
                            ];

                        }

                    }

                    $entry[$fieldName] = $newLinkedSubTypes;

                }

            }

            // link to schema properties
            foreach (['subproperties', 'subPropertyOf'] as $fieldName) {

                if (isset($entry[$fieldName]) && is_array($entry[$fieldName])) {

                    $newLinkedSubTypes = [];

                    foreach ($entry[$fieldName] as $subType) {

                        $filter = [
                            'id' => $subType,
                        ];

                        $linkedEntry = $app->module('collections')->findOne('schema_properties_linked', $filter);
                        
                        if ($linkedEntry) {

                            $newLinkedSubTypes[] = [
                                '_id'     => $linkedEntry['_id'],
                                'link'    => 'schema_properties_linked',
                                'display' => $linkedEntry['id'],
                            ];

                        }

                    }

                    $entry[$fieldName] = $newLinkedSubTypes;

                }

            }

            $app->module('collections')->save($collection . '_linked', $entry);

        }

        $chunkSeconds = time() - $chunkTime;

        CLI::writeln("Converted $chunkCount ($current/$count) entries in $chunkSeconds seconds");

    }

    $seconds = time() - $time;

    CLI::writeln("Done converting $count entries in $seconds seconds", true);
    
}
