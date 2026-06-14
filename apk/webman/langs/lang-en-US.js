/* _AS_STRINGS */
_AS_STRINGS = {};

/*PIHOLE*/
_AS_STRINGS.PIHOLE = {};
_AS_STRINGS.PIHOLE.APP_TITLE        = 'Pi-Hole';
_AS_STRINGS.PIHOLE.TAB_SETTINGS     = 'Settings';
_AS_STRINGS.PIHOLE.TAB_HOSTS        = 'Hosts';
_AS_STRINGS.PIHOLE.TAB_APACHE       = 'Apache';
_AS_STRINGS.PIHOLE.SECTION_GENERAL  = 'General';
_AS_STRINGS.PIHOLE.SECTION_TLS      = 'TLS';
_AS_STRINGS.PIHOLE.SECTION_NETWORK  = 'Network';
_AS_STRINGS.PIHOLE.SECTION_APACHE_SETTINGS = 'Settings';
_AS_STRINGS.PIHOLE.SECTION_LINKS    = 'Links';
_AS_STRINGS.PIHOLE.SECTION_RESULT   = 'Result';
_AS_STRINGS.PIHOLE.LABEL_TIMEZONE   = 'Timezone';
_AS_STRINGS.PIHOLE.LABEL_PASSWORD   = 'Web password';
_AS_STRINGS.PIHOLE.WARN_PASSWORD_PLAINTEXT = '<span style="color:#a32d2d;">Warning: The password is stored in plaintext.</span>';
_AS_STRINGS.PIHOLE.LABEL_TLS_VALIDITY       = 'Use internal Pi-hole TLS certificate';
_AS_STRINGS.PIHOLE.DESC_TLS_VALIDITY        = '<span style="color:#777;font-size:12px;">When enabled, Pi-hole will use its self-signed certificates.</span>';
_AS_STRINGS.PIHOLE.LABEL_HTTP       = 'HTTP bind';
_AS_STRINGS.PIHOLE.LABEL_HTTPS      = 'HTTPS bind';
_AS_STRINGS.PIHOLE.LABEL_DHCP       = 'DHCP passthrough';
_AS_STRINGS.PIHOLE.LINK_OPEN        = 'Open Pi-hole web interface';
_AS_STRINGS.PIHOLE.BTN_RESTART      = 'Restart';

/* Hosts tab */
_AS_STRINGS.PIHOLE.COL_IP                  = 'IP';
_AS_STRINGS.PIHOLE.COL_HOST                = 'Hosts';
_AS_STRINGS.PIHOLE.BTN_ADD                 = 'Add';
_AS_STRINGS.PIHOLE.BTN_MODIFY              = 'Modify';
_AS_STRINGS.PIHOLE.BTN_DELETE              = 'Delete';
_AS_STRINGS.PIHOLE.POPUP_TITLE_ADD         = 'Add Host';
_AS_STRINGS.PIHOLE.POPUP_TITLE_MODIFY      = 'Modify Host';
_AS_STRINGS.PIHOLE.LABEL_IP_ADDRESS        = 'IP address';
_AS_STRINGS.PIHOLE.ERR_INVALID_IP          = 'Invalid IPv4 address';
_AS_STRINGS.PIHOLE.ERR_NO_QUOTES           = 'Quotes are not allowed';
_AS_STRINGS.PIHOLE.WARN_HOSTS_PERSISTENCE = '<span style="color:#a32d2d;font-size:12px;white-space:nowrap;">Warning: Configuration of the hosts requires the cappysan-persistence package installed.</span><div style="height:12px;"></div>';

/* Apache tab */
_AS_STRINGS.PIHOLE.WARN_APACHE_CAPPYSAN = '<span style="color:#a32d2d;font-size:12px;"><strong>Warning:</strong> Configuration of Apache requires the cappysan-apache package installed.</span>';
_AS_STRINGS.PIHOLE.APACHE_NOT_IMPLEMENTED = 'Apache configuration is not available. This feature requires the cappysan-apache package.';
_AS_STRINGS.PIHOLE.LABEL_APACHE_PROXY = 'Enable Apache proxy';
_AS_STRINGS.PIHOLE.LABEL_APACHE_HOSTNAME = 'Hostname';
_AS_STRINGS.PIHOLE.LABEL_APACHE_FQDN = 'Server FQDN';
_AS_STRINGS.PIHOLE.LABEL_APACHE_PLACEHOLDERS = 'Available placeholders: ${hostname}, ${domain}';
_AS_STRINGS.PIHOLE.LABEL_APACHE_REDIRECT = 'HTTP redirection';
_AS_STRINGS.PIHOLE.LABEL_APACHE_PROXY_TO = 'HTTPS proxy';
_AS_STRINGS.PIHOLE.LINK_OVERRIDE_HINT = 'Custom URL override';
