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
                        settings: AS.ARC.util.fixDc('/apps/cappysan-pi-hole/images/icon-fn-settings.png'),
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
                xtype:  'fieldset',
                title:  _S('PIHOLE', 'SECTION_LINK'),
                defaults: { anchor: '100%' },
                items: [{
                    xtype:  'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype:  'displayfield',
                        itemId: 'piholeLink',
                        value:  (function() {
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
            }, {
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
                    value: _S('PIHOLE', 'NOTICE_HOSTS_PERSISTENCE')
                }, {
                    xtype: 'displayfield',
                    value: _S('PIHOLE', 'NOTICE_APACHE_SITES')
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
            hostname = fn.win.down('#apacheHostname'),
            fqdn     = fn.win.down('#apacheFqdn'),
            redirect = fn.win.down('#apacheRedirect'),
            proxyTo  = fn.win.down('#apacheProxyTo');

        fn.win.el.mask(_S('COMMON', 'APPLYING'));
        AS.ARC.ajax({
            url:    AS.ARC.util.getApiUrlWithSid(fn.apiUrl, { act: 'set', tab: 'apache' }),
            method: 'post',
            params: {
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
