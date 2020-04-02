
<schema-card>

    <style>
        .badge {
            display: inline-block;
            margin: .2em;
            padding: .2em .4em;
            color: #222;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        h3 {
            margin: 0 0 .2em;
            font-size: 14px;
            font-weight: bold;
        }
        a[href^='http']:before {
            content: "\f08e";
            font-family: FontAwesome;
            font-weight: normal;
            font-style: normal;
            line-height: 1;
            margin: 0 .4em 0 .2em;
            color: #888;
        }
        .breadcrumb {
            margin: 0;
            padding: 0;
            list-style: none;
            display: block;
        }
        .breadcrumb .breadcrumb {
            margin: 0;
        }
        .breadcrumb li {
            display: block;
            line-height: 1;
        }
        .breadcrumb a, .breadcrumb span {
            vertical-align: middle;
            margin: 0;
            padding: 0;
        }
        .breadcrumb li li a:before, .breadcrumb li li span:before {
            content: "\f101";
            font-family: FontAwesome;
            font-weight: normal;
            font-style: normal;
            line-height: 1;
            margin-right: .2em;
            color: #888;
        }
        schema-breadcrumbs {
            display: inline-block;
            vertical-align: middle;
            padding: .2em;
        }
        schema-breadcrumbs.hover:hover, schema-breadcrumbs.hover:focus-within {
            box-shadow: 0 0 4px #ccc;
        }
        .float-right {
            float: right;
            margin-left: 15px;
        }
    </style>

    <div class="uk-panel uk-panel-box uk-panel-card uk-panel-header">

        <div class="uk-float-right">
            <span>{ App.i18n.get('ID') }: <a href="{ entry.id.replace(/^http:/, 'https:') }" target="_blank">{ entry.id }</a></span>
            <a href="https://{ entry.ext }.schema.org" target="_blank" class="uk-badge { entry.ext == 'pending' && 'uk-badge-warning' }" if="{ entry.ext }" title="{ App.i18n.get('Extension') }" data-uk-tooltip>{ entry.ext }</a>
        </div>

        <h3 class="uk-panel-title">{ entry.label }</h3>

        <div class="breadcrumb-container float-right uk-panel-card uk-margin-bottom" if="{ entry._meta && entry._meta.parents && entry._meta.parents.length }">
            <schema-breadcrumbs breadcrumbs="{ entry._meta.parents }"></schema-breadcrumbs>
        </div>

        <div class="uk-margin">
            <raw content="{ entry.comment }"></raw>
        </div>

        <div class="uk-margin" if="{ !ignore.includes(idx) }" each="{ prop, idx in entry }">
            <schema-link prop="{ prop }" idx="{ idx }" meta="{ meta && meta[idx] }"></schema-link>
        </div>

    </div>

    <script>

        this.entry = opts.entry;
        this.meta = this.entry._meta || null;

        this.ignore = [
            '_id',
            '_created',
            '_modified',
            'id',
            'label',
            'comment',
            'pending',
            '_meta',
            'unknown',
            'type',
            'ext',
        ];

        this.on('mount', function() {

            var breadcrumbContainer = document.querySelector('.breadcrumb-container');
            if (breadcrumbContainer) {
                if (breadcrumbContainer.offsetWidth > breadcrumbContainer.parentElement.offsetWidth / 2) {
                    breadcrumbContainer.classList.remove('float-right');
                } else {
                    breadcrumbContainer.classList.add('float-right');
                }
            }

        });

        loadSchemaType(e) {
            if (e) e.preventDefault();
            this.parent.load(e.item.item.label);
        }

    </script>

</schema-card>

<schema-breadcrumbs>

    <ul class="breadcrumb">
        <li class="" each="{ item in opts.breadcrumbs }">
            <a href="{ App.route('/schemas/schema/') + item.label }" onclick="{ loadSchemaType }" if="{ item.children }">{ item.label }</a>
            <span class="" if="{ !item.children }">{ item.label }</span>
            <schema-breadcrumbs class="{ item.children.length > 1 && 'hover' }" if="{ item.children }" breadcrumbs="{ item.children }"></schema-breadcrumbs>
        </li>
    </ul>

    <script>

        this.loadSchemaType = this.parent.loadSchemaType;

    </script>

</schema-breadcrumbs>

<schema-link>

    <h3 class="" if="{ !skip }">{ opts.idx }</h3>

    <a class="badge" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" if="{ prop && isLink }" each="{ item in prop }" data-item="{ item }">{ item }</a>

    <span class="badge" if="{ prop && !isLink }" each="{ item in prop }" data-item="{ item }">{ item }</span>

    <a class="badge uk-text-warning" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" if="{ pending }" each="{ item in pending }" title="{ App.i18n.get('Pending') }" data-uk-tooltip data-item="{ item }">{ item }</a>

    <div class="inherited" if="{ inherited && inheritedItem.length }" each="{ inheritedItem, idy in inherited }">
        <strong>{ App.i18n.get('from') + ' ' + idy }</strong>
        <a class="badge" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" each="{ item in inheritedItem }" data-item="{ item }">{ item }</a>
    </div>

    <script>

        var $this = this;

        this.skip = false;
        this.external = false;
        this.isLink = true;

        this.prop = opts.prop && Array.isArray(opts.prop) && opts.prop.length
            ? opts.prop : null;

        this.pending = opts.meta && opts.meta.pending && opts.meta.pending.length
            ? opts.meta.pending : null;

        this.inherited = opts.meta && opts.meta.inherited
            && typeof opts.meta.inherited == 'object'
            && Object.keys(opts.meta.inherited).length
                ? opts.meta.inherited : null;

        if (!this.prop && !this.pending && !this.inherited) this.skip = true;

        // some schemas have only pending or inherted properties
        var propToCheck = this.prop && this.prop[0] ? this.prop[0]
            : ( this.pending && this.pending[0] ? this.pending[0]
                : ( this.inherited && Object.keys(this.inherited)[0]
                    ? this.inherited[Object.keys(this.inherited)[0]][0] : '' ) );

        if (propToCheck && propToCheck.match(/^http/)) {
            this.external = true;
        }
        else if (propToCheck && propToCheck.match(/^rdfs?:/)) {
            this.isLink = false;
        }

        this.on('mount', function() {

            var links = this.root.querySelectorAll('a:not([href^="http"])');

            links.forEach(function(l) {
                l.addEventListener('click', function(e) {
                    if (e) e.preventDefault();
                    $this.parent.parent.load(e.target.dataset.item);
                });
            });

        });

        url(str) {
            // https replacement fails for `http://xmlns.com`
            // if (str.match(/^http/)) return str.replace(/^http:/, 'https:');
            if (str.match(/^http/)) return str;
            if (str.match(/^rdfs?:/)) return '#';
            return App.route('/schemas/schema/' + str);
        }

    </script>

</schema-link>
