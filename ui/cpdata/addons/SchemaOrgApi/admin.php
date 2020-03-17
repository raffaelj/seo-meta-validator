<?php

// to do:
// * [ ] Admin Controller
// * [ ] acl
// * [ ] ui

$this->bind('/schemaorgapi/import_schemas', function() {
    
    $ret = $this->module('schemaorgapi')->import();

    return $ret;

});

$this->bind('/schemaorgapi/convert_schemas', function() {

    $this->module('schemaorgapi')->convertToLinkedCollections();

    return 'converted to linked collection';

});
