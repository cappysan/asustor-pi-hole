/* Copyright (c) 2026 Cappysan. All rights reserved. */

Ext.define('AS.ARC.apps.pihole.core', {
    extend: 'Ext.util.Observable',

    apiUrl: AS.ARC.util.getUserAppsPath() + 'cappysan-pi-hole/' + 'pi-hole.cgi',

    constructor: function (config) {
        Ext.apply(this, config);
        this.callParent();
        this.init(config);
    },

    init: function () {
        var fn = this;

        fn.win = fn.desktop.createWindow({
            app:       fn.app,
            id:        fn.id,
            itemId:    fn.id,
            title:     '<div class="as-header" style="background-image:url(' + AS.ARC.util.fixDc('/apps/cappysan-pi-hole/images/icon-app-task.png') + ');background-position:50%;background-repeat:no-repeat;"></div><div class="as-header-text">Pi-Hole</div>',

            width:     700,
            height:    500,
            minWidth:  700,
            minHeight: 500,
            resizable: true,
            border:    false,
            layout:    'fit',
            items:     [fn.getMainPanel()],
            listeners: {
                afterrender: function (win) {
                    win.header.items.items[1].hide();
                    fn.navGrid.getSelectionModel().select(0);
                }
            }
        });
    },

    getNavGrid: function () {
        var fn = this;

        fn.navGrid = Ext.create('Ext.grid.Panel', {
            itemId: 'navGrid',
            store: Ext.create('Ext.data.ArrayStore', {
                fields: ['title', 'tabId'],
                data: [
                    [_S('PIHOLE', 'TAB_SETTINGS'), 'settings'],
                    [_S('PIHOLE', 'TAB_HOSTS'),    'hosts'],
                    [_S('PIHOLE', 'TAB_APACHE'),   'apache']
                ]
            }),
            hideHeaders: true,
            height:      '100%',
            border:      false,
            columns: [{
                flex:     1,
                renderer: function (v, metadata, record) {
                    var icons = {
                        settings: AS.ARC.util.fixDc('apps/settings/images/icon-fn-certificate.png'),
                        hosts:    AS.ARC.util.fixDc('/apps/cappysan-pi-hole/images/icon-fn-file.png'),
                        apache:   AS.ARC.util.fixDc('/apps/cappysan-pi-hole/images/icon-fn-apache.png')
                    };
                    var iconUrl = icons[record.data.tabId] || icons.settings;
                    return '<div class="fn-block">' +
                           '<div class="fn-icon" style="background-image:url(' + iconUrl + ');background-repeat:no-repeat;background-position:center center;background-size:contain;"></div>' +
                           '<div class="fn-title" style="width:130px;opacity:1;">' + record.data.title + '</div>' +
                           '<div class="x-clear"></div>' +
                           '</div>';
                }
            }],
            listeners: {
                selectionchange: function (model, selections) {
                    if (selections.length > 0) {
                        fn.switchTab(selections[0].get('tabId'));
                    }
                }
            }
        });

        return fn.navGrid;
    },

    switchTab: function (tabId) {
        var fn        = this,
            cardPanel = fn.win.down('#cardPanel');

        fn.win.el.mask(_S('COMMON', 'LOADING'));

        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'get', tab: tabId }),
            method: 'post',
            success: function (json) {
                fn.win.el.unmask();
                cardPanel.removeAll();
                if (tabId === 'settings') { fn.renderSettingsTab(cardPanel, json); }
                if (tabId === 'hosts')    { fn.renderHostsTab(cardPanel, json); }
                if (tabId === 'apache')   { fn.renderApacheTab(cardPanel, json); }
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Settings tab ───────────────────────────────────────────────────── */
    renderSettingsTab: function (cardPanel, json) {
        var fn         = this,
            labelWidth = 160;

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-pi-hole',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'SECTION_GENERAL'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_TIMEZONE')),
                    labelWidth: labelWidth,
                    itemId:     'settingsTz',
                    anchor:     '100%',
                    emptyText:  'Etc/GMT',
                    value:      json.tz || ''
                }, {
                    xtype:      'textfield',
                    inputType:  'password',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_PASSWORD')),
                    labelWidth: labelWidth,
                    itemId:     'settingsPassword',
                    anchor:     '100%',
                    value:      json.web_password || ''
                }, {
                    xtype:      'displayfield',
                    labelWidth: labelWidth,
                    hideLabel:  true,
                    value:      _S('PIHOLE', 'WARN_PASSWORD_PLAINTEXT')
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'SECTION_TLS'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'checkbox',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_TLS_VALIDITY')),
                    labelWidth: labelWidth,
                    itemId:     'settingsTlsValidity',
                    checked:    json.tls_validity === 1 || json.tls_validity === '1'
                }, {
                    xtype:      'displayfield',
                    labelWidth: labelWidth,
                    hideLabel:  true,
                    value:      _S('PIHOLE', 'DESC_TLS_VALIDITY')
                }]
            }, {
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'SECTION_NETWORK'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_HTTP')),
                    labelWidth: labelWidth,
                    itemId:     'settingsHttp',
                    anchor:     '100%',
                    emptyText:  '0.0.0.0:5010',
                    value:      json.web_http || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_HTTPS')),
                    labelWidth: labelWidth,
                    itemId:     'settingsHttps',
                    anchor:     '100%',
                    emptyText:  '0.0.0.0:5011',
                    value:      json.web_https || ''
                }, {
                    xtype:      'checkbox',
                    fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_DHCP')),
                    labelWidth: labelWidth,
                    itemId:     'settingsDhcp',
                    checked:    json.dhcp_passthrough === true || json.dhcp_passthrough === 'true'
                }]
            }, {
                xtype:  'fieldset',
                title:  _S('PIHOLE', 'SECTION_LINKS'),
                defaults: { anchor: '100%' },
                items: [{
                    xtype:  'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype:  'displayfield',
                        itemId: 'piholeLink',
                        value:  (function() {
                            // If user has a saved override, use it
                            if (json.web_url_override) {
                                return '<a href="' + json.web_url_override + '" target="_blank">' + _S('PIHOLE', 'LINK_OPEN') + '</a>';
                            }

                            var apacheEnabled = json.apache_proxy_enabled === true || json.apache_proxy_enabled === 'true';

                            if (apacheEnabled) {
                                var fqdn = json.apache_fqdn || json.fqdn || json.hostname || 'localhost';
                                return '<a href="https://' + fqdn + '/" target="_blank">' + _S('PIHOLE', 'LINK_OPEN') + '</a>';
                            }

                            var port = '5011';
                            var host = '';

                            if (json.web_https) {
                                var parts = json.web_https.match(/^(.+):(\d+)$/);
                                if (parts) {
                                    if (parts[1] !== '0.0.0.0') { host = parts[1]; }
                                    port = parts[2];
                                }
                            }

                            if (!host) {
                                host = json.gateway_ip || json.hostname || 'localhost';
                            }

                            return '<a href="https://' + host + ':' + port + '/" target="_blank">' + _S('PIHOLE', 'LINK_OPEN') + '</a>';
                        })(),
                        margin: '0 10 0 0'
                    }, {
                        xtype:     'textfield',
                        itemId:    'piholeLinkOverride',
                        emptyText: _S('PIHOLE', 'LINK_OVERRIDE_HINT'),
                        flex:      1,
                        value:     json.web_url_override || '',
                        listeners: {
                            change: function (field, newVal) {
                                var linkField = fn.win.down('#piholeLink');
                                if (linkField) {
                                    if (newVal) {
                                        linkField.setValue('<a href="' + newVal + '" target="_blank">' + _S('PIHOLE', 'LINK_OPEN') + '</a>');
                                    }
                                }
                            }
                        }
                    }]
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('PIHOLE', 'BTN_RESTART'),
                        cls:     'pihole-btn-white',
                        handler: function () { fn.restartContainer(); }
                    },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveSettingsTab(); }
                    }
                ]
            }]
        }));
    },

    saveSettingsTab: function () {
        var fn          = this,
            tz          = fn.win.down('#settingsTz'),
            password    = fn.win.down('#settingsPassword'),
            http        = fn.win.down('#settingsHttp'),
            https       = fn.win.down('#settingsHttps'),
            tls         = fn.win.down('#settingsTlsValidity'),
            dhcp        = fn.win.down('#settingsDhcp'),
            urlOverride = fn.win.down('#piholeLinkOverride');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'settings' }),
            method: 'post',
            params: {
                tz:                tz          ? (tz.getValue() || 'Etc/GMT') : 'Etc/GMT',
                web_password:      password    ? password.getValue() : '',
                web_http:          http        ? http.getValue()     : '',
                web_https:         https       ? https.getValue()    : '',
                tls_validity:      tls         ? (tls.getValue() ? '1' : '0') : '0',
                dhcp_passthrough:  dhcp        ? (dhcp.getValue() ? 'true' : 'false') : 'false',
                web_url_override:  urlOverride ? urlOverride.getValue() : ''
            },
            success: function () {
                fn.win.el.unmask();
                fn.switchTab('settings');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Hosts tab ──────────────────────────────────────────────────────── */
    renderHostsTab: function (cardPanel, json) {
        var fn   = this,
            rows = [];

        if (json.content) {
            Ext.each(json.content.split('\n'), function (line) {
                line = Ext.String.trim(line);
                if (!line || line.charAt(0) === '#') { return; }
                var parts = line.split(/[ \t]+/);
                if (parts.length >= 2) {
                    rows.push({ ip: parts[0], host: parts.slice(1).join(' ') });
                }
            });
        }

        var store = Ext.create('Ext.data.Store', {
            fields: ['ip', 'host'],
            data:   rows
        });

        var grid = Ext.create('Ext.grid.Panel', {
            itemId:   'hostsGrid',
            store:    store,
            border:   false,
            anchor:   '100%',
            height:   200,
            columns: [{
                text:      _S('PIHOLE', 'COL_IP'),
                dataIndex: 'ip',
                flex:      1
            }, {
                text:      _S('PIHOLE', 'COL_HOST'),
                dataIndex: 'host',
                flex:      2
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'top',
                items: [{
                    xtype: 'displayfield',
                    value: _S('PIHOLE', 'WARN_HOSTS_PERSISTENCE')
                }]
            }, {
                xtype: 'toolbar',
                dock:  'top',
                items: [{
                    text:    _S('PIHOLE', 'BTN_ADD'),
                    handler: function () { fn.showHostPopup('add', null, store); }
                }, {
                    text:     _S('PIHOLE', 'BTN_MODIFY'),
                    itemId:   'hostsModifyBtn',
                    disabled: true,
                    handler: function () {
                        var sel = grid.getSelectionModel().getSelection();
                        if (sel.length) { fn.showHostPopup('modify', sel[0], store); }
                    }
                }, {
                    text:     _S('PIHOLE', 'BTN_DELETE'),
                    itemId:   'hostsDeleteBtn',
                    disabled: true,
                    handler: function () {
                        var sel = grid.getSelectionModel().getSelection();
                        if (sel.length) { store.remove(sel); }
                    }
                }]
            }],
            listeners: {
                selectionchange: function (model, sel) {
                    var has = sel.length > 0;
                    grid.down('#hostsModifyBtn').setDisabled(!has);
                    grid.down('#hostsDeleteBtn').setDisabled(!has);
                }
            }
        });

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-pi-hole',
            border:     false,
            layout:     'border',
            items: [{
                region:   'north',
                border:   false,
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'TAB_HOSTS'),
                height:   280,
                defaults: { anchor: '100%' },
                layout:   'anchor',
                items:    [grid]
            }, {
                region:   'center',
                border:   false,
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'SECTION_RESULT'),
                defaults: { anchor: '100%' },
                layout:   'fit',
                items: [{
                    xtype:      'textarea',
                    readOnly:   true,
                    fieldStyle: 'font-family: monospace; font-size: 13px;',
                    value:      json.content || ''
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock:  'top',
                    hidden: true
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveHostsTab(); }
                    }
                ]
            }]
        }));
    },

    showHostPopup: function (mode, record, store) {
        var fn       = this,
            isModify = (mode === 'modify');

        fn.hostPopup = Ext.create('AS.ARC.msgWindow', {
            parentWin: fn.win,
            title:     isModify ? _S('PIHOLE', 'POPUP_TITLE_MODIFY') : _S('PIHOLE', 'POPUP_TITLE_ADD'),
            width:     480,
            height:    200,
            iconType:  'info',
            asItems: [{
                xtype:      'textfield',
                fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'LABEL_IP_ADDRESS')),
                itemId:     'popupIp',
                labelWidth: 70,
                width:      340,
                value:      isModify ? record.get('ip') : ''
            }, {
                xtype:      'textfield',
                fieldLabel: AS.ARC.util.fontToBold(_S('PIHOLE', 'COL_HOST')),
                itemId:     'popupHost',
                labelWidth: 70,
                width:      340,
                value:      isModify ? record.get('host') : ''
            }],
            fbar: [{
                text:    _S('COMMON', 'OK'),
                handler: function () {
                    var ipFld = fn.hostPopup.down('#popupIp'),
                        hFld  = fn.hostPopup.down('#popupHost');

                    if (!ipFld || !hFld) { return; }

                    var ip   = Ext.String.trim(ipFld.getValue()),
                        host = Ext.String.trim(hFld.getValue());

                    // IPv4: dotted decimal, IPv6: colon-hex (full, compressed, mapped)
                    var ipv4Re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    var ipv6Re = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

                    if (!ip) {
                        ipFld.markInvalid(_S('PIHOLE', 'ERR_INVALID_IP'));
                        return;
                    }
                    if (!ipv4Re.test(ip) && !ipv6Re.test(ip)) {
                        ipFld.markInvalid(_S('PIHOLE', 'ERR_INVALID_IP'));
                        return;
                    }
                    if (!host) {
                        hFld.markInvalid(_S('COMMON', 'REQUIRED'));
                        return;
                    }
                    if (ip.indexOf("'") !== -1 || ip.indexOf('"') !== -1) {
                        ipFld.markInvalid(_S('PIHOLE', 'ERR_NO_QUOTES'));
                        return;
                    }
                    if (host.indexOf("'") !== -1 || host.indexOf('"') !== -1) {
                        hFld.markInvalid(_S('PIHOLE', 'ERR_NO_QUOTES'));
                        return;
                    }

                    if (isModify) {
                        record.set('ip',   ip);
                        record.set('host', host);
                    } else {
                        store.add({ ip: ip, host: host });
                    }
                    fn.hostPopup.close();
                }
            }, {
                text:    _S('COMMON', 'CANCEL'),
                handler: function () { fn.hostPopup.close(); }
            }]
        });

        fn.hostPopup.show();
    },

    saveHostsTab: function () {
        var fn    = this,
            grid  = fn.win.down('#hostsGrid'),
            lines = [];

        grid.getStore().each(function (rec) {
            var ip   = Ext.String.trim(rec.get('ip')),
                host = Ext.String.trim(rec.get('host'));
            if (ip && host) { lines.push(ip + '\t' + host); }
        });

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'hosts' }),
            method: 'post',
            params: { content: lines.join('\n') },
            success: function (json) {
                fn.win.el.unmask();
                if (json && json.warning) {
                    AS.ARC.msgWindow.show({ parentWin: fn.win, title: _S('COMMON', 'WARNING'), width: 400, height: 160, iconType: 'warn', asItems: [{ xtype: 'displayfield', value: json.warning }], fbar: [{ text: _S('COMMON', 'OK'), handler: function () { this.up('window').close(); } }] });
                }
                fn.switchTab('hosts');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    restartContainer: function () {
        var fn = this;

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'restart' }),
            method: 'post',
            success: function () { fn.win.el.unmask(); },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Apache tab ──────────────────────────────────────────────────────── */
    renderApacheTab: function (cardPanel, json) {
        var fn = this;

        cardPanel.add(Ext.create('Ext.panel.Panel', {
            cls:        'as-page-panel app-cappysan-pi-hole',
            border:     false,
            layout:     'anchor',
            autoScroll: true,
            defaults:   { anchor: '100%' },
            items: [{
                xtype:    'fieldset',
                title:    _S('PIHOLE', 'SECTION_APACHE_SETTINGS'),
                defaults: { anchor: '100%', msgTarget: AS.ARC.config.msgTarget },
                items: [{
                    xtype: 'displayfield',
                    value: _S('PIHOLE', 'WARN_APACHE_CAPPYSAN')
                }, {
                    xtype:      'checkbox',
                    fieldLabel: _S('PIHOLE', 'LABEL_APACHE_PROXY'),
                    itemId:     'apacheProxyCheckbox',
                    checked:    json.apache_proxy_enabled === true || json.apache_proxy_enabled === 'true'
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PIHOLE', 'LABEL_APACHE_HOSTNAME'),
                    itemId:     'apacheHostname',
                    emptyText:  'pi-hole',
                    value:      json.apache_hostname || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PIHOLE', 'LABEL_APACHE_FQDN'),
                    itemId:     'apacheFqdn',
                    emptyText:  '${hostname}.${domain}',
                    value:      json.apache_fqdn || ''
                }, {
                    xtype: 'displayfield',
                    value: _S('PIHOLE', 'LABEL_APACHE_PLACEHOLDERS')
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PIHOLE', 'LABEL_APACHE_REDIRECT'),
                    itemId:     'apacheRedirect',
                    emptyText:  'https://${server_fqdn}/',
                    value:      json.apache_redirect_to || ''
                }, {
                    xtype:      'textfield',
                    fieldLabel: _S('PIHOLE', 'LABEL_APACHE_PROXY_TO'),
                    itemId:     'apacheProxyTo',
                    emptyText:  'https://127.0.0.1:5011/',
                    value:      json.apache_proxy_to || ''
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock:  'bottom',
                ui:    'footer',
                items: [
                    { xtype: 'component', flex: 1 },
                    {
                        xtype:   'button',
                        text:    _S('COMMON', 'APPLY'),
                        handler: function () { fn.saveApacheTab(); }
                    }
                ]
            }]
        }));
    },

    saveApacheTab: function () {
        var fn       = this,
            proxy    = fn.win.down('#apacheProxyCheckbox'),
            hostname = fn.win.down('#apacheHostname'),
            fqdn     = fn.win.down('#apacheFqdn'),
            redirect = fn.win.down('#apacheRedirect'),
            proxyTo  = fn.win.down('#apacheProxyTo');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'apache' }),
            method: 'post',
            params: {
                apache_proxy_enabled: proxy    ? (proxy.getValue() ? 'true' : 'false') : 'false',
                apache_hostname:      hostname ? hostname.getValue() : 'pi-hole',
                apache_fqdn:          fqdn     ? fqdn.getValue()     : '${hostname}.${domain}',
                apache_redirect_to:   redirect ? redirect.getValue() : 'https://${server_fqdn}/',
                apache_proxy_to:      proxyTo  ? proxyTo.getValue()  : 'https://127.0.0.1:5011/'
            },
            success: function (json) {
                fn.win.el.unmask();
                if (json && json.warning) {
                    AS.ARC.msgWindow.show({ parentWin: fn.win, title: _S('COMMON', 'WARNING'), width: 400, height: 160, iconType: 'warn', asItems: [{ xtype: 'displayfield', value: json.warning }], fbar: [{ text: _S('COMMON', 'OK'), handler: function () { this.up('window').close(); } }] });
                }
                fn.switchTab('apache');
            },
            failure: function (json) {
                fn.win.el.unmask();
                AS.ARC.util.showMsgWindow({ 5000: _S('COMMON', 'SESSION_TIMEOUT') }, json, fn.win);
            }
        });
    },

    /* ── Layout ─────────────────────────────────────────────────────────── */
    getMainPanel: function () {
        var fn = this;

        return Ext.create('Ext.panel.Panel', {
            itemId: 'main',
            border: false,
            layout: 'border',
            items: [{
                region: 'west',
                itemId: 'westPanel',
                cls:    'as-selector-panel',
                border: false,
                width:  150,
                layout: 'fit',
                items:  [fn.getNavGrid()]
            }, {
                region: 'center',
                xtype:  'panel',
                itemId: 'cardPanel',
                border: false,
                layout: 'fit'
            }]
        });
    }
});

Ext.define('AS.ARC.apps.pihole.main', {
    extend:     'AS.ARC._appBase',
    appTag:     'cappysan-pi-hole',
    title:      'Pi-Hole',
    appMaxNum:  1,
    appOpenNum: 0,
    appIsReady: true,
    appWins:    [],

    createWindow: function () {
        var desktop = this.core.getDesktop(),
            app     = this;

        if ((this.appOpenNum === this.appMaxNum) || !this.appIsReady) {
            this.appWins[0].show();
            return;
        }

        this.appIsReady = false;

        var pihole = Ext.create('AS.ARC.apps.pihole.core', {
            app:     this,
            desktop: desktop,
            id:      this.id + '-' + Ext.id()
        });

        pihole.win.on('render', function () {
            app.appOpenNum++;
            app.appIsReady = true;
        });

        pihole.win.on('beforeclose', function () {
            app.appOpenNum--;
            app.appIsReady = true;
            app.appWins.pop();
        });

        pihole.win.show();
        this.appWins.push(pihole.win);
        return pihole.win;
    }
});
