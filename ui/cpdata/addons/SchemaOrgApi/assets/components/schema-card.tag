
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
            margin-right: .2em;
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
        }
        .breadcrumb a {
            vertical-align: middle;
            padding: .2em .4em;
        }
        .breadcrumb li li a:before {
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

        schema-breadcrumbs schema-breadcrumbs:hover, schema-breadcrumbs schema-breadcrumbs:focus {
            box-shadow: 0 0 4px #ccc;
        }
    </style>

    <div class="uk-panel uk-panel-box uk-panel-card uk-panel-header">

        <div class="uk-float-right">
            <span>{ App.i18n.get('ID') }: <a href="{ entry.id.replace(/^http:/, 'https:') }" target="_blank" title="{ App.i18n.get('Open external link') }" data-uk-tooltip>{ entry.id }</a></span>
            <span class="uk-badge uk-badge-warning" if="{ entry.pending }">{ App.i18n.get('Pending') }</span>
        </div>

        <h3 class="uk-panel-title">{ entry.label }</h3>

        <div class="uk-panel-box uk-panel-card uk-float-right" if="{ entry._meta && entry._meta.parents && entry._meta.parents.length }">
            <schema-breadcrumbs breadcrumbs="{ entry._meta.parents }"></schema-breadcrumbs>
        </div>

        <div class="uk-margin">
            <schema-comment comment="{ entry.comment }"></schema-comment>
        </div>

        <schema-link prop="{ prop }" idx="{ idx }" meta="{ meta && meta[idx] }" if="{ !ignore.includes(idx) }" each="{ prop, idx in entry }"></schema-link>

    </div>

    <script>

        this.entry = opts.entry;
        this.type = opts.type;
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
        ];

        loadSchemaType(e) {
            if (e) e.preventDefault();
            this.parent.load('type', e.item.item.label);
        }

    </script>

</schema-card>

<schema-breadcrumbs>

    <ul class="breadcrumb">
        <li class="" each="{ item in opts.breadcrumbs }">
            <a href="{ App.route('/schemas/type/') + item.label }" onclick="{ loadSchemaType }">{ item.label }</a>
            <schema-breadcrumbs if="{ item.children }" breadcrumbs="{ item.children }"></schema-breadcrumbs>
        </li>
    </ul>

    <script>

        this.loadSchemaType = this.parent.loadSchemaType;

    </script>

</schema-breadcrumbs>

<schema-comment>

    <raw content="{ opts.comment.replace(/(<br\s?\/?>)+/g, '<br><br>') }"></raw>

</schema-comment>

<schema-link>

    <div class="uk-margin">

        <h3 class="{ !prop.length && 'uk-text-muted' }">{ opts.idx }</h3>

        <a class="badge" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" if="{ prop && type }" each="{ item in prop }" data-item="{ item }">{ item }</a>

        <a class="badge uk-text-warning" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" if="{ pending }" each="{ item in pending }" title="{ App.i18n.get('Pending') }" data-uk-tooltip data-item="{ item }">{ item }</a>

        <div class="inherited" if="{ inherited && inheritedItem.length }" each="{ inheritedItem, idy in inherited }">
            <strong>{ App.i18n.get('from') + ' ' + idy }</strong>
            <a class="badge" href="{ url(item) }" target="{ external ? '_blank' : '_self' }" each="{ item in inheritedItem }" data-item="{ item }">{ item }</a>
        </div>

    </div>

    <script>

        var $this = this;

        this.external = false;

        this.prop = opts.prop && Array.isArray(opts.prop) && opts.prop.length ? opts.prop : null;

        this.pending = opts.meta && opts.meta.pending ? opts.meta.pending : null;

        this.inherited = opts.meta && opts.meta.inherited && typeof opts.meta.inherited == 'object' ? opts.meta.inherited : null;

        // all types start with uppercase, all properties with lowercase character,
        // but some schemas have only pending or inherted properties
        var propToCheck = this.prop && this.prop[0] ? this.prop[0]
            : ( this.pending && this.pending[0] ? this.pending[0]
                : ( this.inherited && Object.keys(this.inherited)[0] ? this.inherited[Object.keys(this.inherited)[0]][0] : '' ) );

        // type check has false positive for `http...`, but it is irrelevant for these items
        this.type = propToCheck && propToCheck.match(/^[a-z]/) ? 'property'
                    : (propToCheck && propToCheck.match(/^[A-Z]/) ? 'type' : null);

        if (propToCheck && propToCheck.match(/^http/)) {
            this.external = true;
            this.route = '';
        }
        else {
            this.route = App.route('/schemas/' + this.type + '/');
        }

        this.on('mount', function() {

            var links = this.root.querySelectorAll('a:not([href^="http"]');

            links.forEach(function(l) {
                l.addEventListener('click', function(e) {
                    if (e) e.preventDefault();
                    $this.parent.parent.load($this.type, e.target.dataset.item);
                });
            });

        });

        url(str) {
            // https replacement fails for `http://xmlns.com`
            // return this.external ? str.replace(/^http:/, 'https:') : this.route + str;
            return this.external ? str : this.route + str;
        }

    </script>

</schema-link>
