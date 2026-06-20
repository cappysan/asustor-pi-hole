#!/bin/sh
# Pi-Hole CGI

LOG=/tmp/pi-hole-ui.log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] === invoked === method=$REQUEST_METHOD qs=$QUERY_STRING len=$CONTENT_LENGTH" >> "$LOG"

BODY=""
if [ "$REQUEST_METHOD" = "POST" ] && [ -n "$CONTENT_LENGTH" ] && [ "$CONTENT_LENGTH" -gt 0 ]; then
    BODY=$(dd bs=1 count="$CONTENT_LENGTH" 2>/dev/null)
fi

ALL_PARAMS="${QUERY_STRING}&${BODY}"

urldecode() {
    echo "$1" | awk 'BEGIN{
        for (i=0; i<256; i++) chr[sprintf("%02X", i)] = sprintf("%c", i)
    }
    {
        gsub(/\+/, " ")
        out = ""
        while (match($0, /%[0-9A-Fa-f][0-9A-Fa-f]/)) {
            out = out substr($0, 1, RSTART-1) chr[toupper(substr($0, RSTART+1, 2))]
            $0 = substr($0, RSTART+RLENGTH)
        }
        print out $0
    }'
}

get_param() {
    raw=$(echo "$ALL_PARAMS" | tr '&' '\n' | grep "^${1}=" | head -1 | cut -d= -f2-)
    urldecode "$raw"
}

ACT=$(get_param act)
TAB=$(get_param tab)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] act=$ACT tab=$TAB" >> "$LOG"

respond() {
    printf 'Content-Type: application/json\r\n\r\n'
    printf '%s' "$1"
}

CFG_DIR="/share/Configuration/pi-hole"
if [ -n "$APKG_CFG_DIR" ]; then CFG_DIR="$APKG_CFG_DIR"; fi
CUSTOM_ENV="${CFG_DIR}/custom.env"

APACHE_SITES_AVAILABLE="${CFG_DIR}/deps.d/apache/sites-available"
APACHE_SITES_ENABLED="${CFG_DIR}/deps.d/apache/sites-enabled"
APACHE_CONF_AVAILABLE="${APACHE_SITES_AVAILABLE}/pi-hole.conf"
APACHE_CONF_ENABLED="${APACHE_SITES_ENABLED}/pi-hole.conf"

find_python() {
    for P in python3 python /usr/local/bin/python3 /usr/bin/python3 /usr/bin/python; do
        if command -v "$P" >/dev/null 2>&1; then echo "$P"; return; fi
    done
}

case "$ACT" in

    get)
        PYTHON=$(find_python)
        if [ -z "$PYTHON" ]; then
            respond '{"success":false,"error_code":500,"error_msg":"No python interpreter found"}'
            exit 0
        fi

        case "$TAB" in
            settings)
                # Check apache proxy state for the link builder
                APACHE_PROXY_ENABLED="false"
                if [ -f "$APACHE_CONF_AVAILABLE" ]; then
                    APACHE_PROXY_ENABLED="true"
                fi

                export _CUSTOM_ENV="$CUSTOM_ENV" _APACHE_PROXY_ENABLED="$APACHE_PROXY_ENABLED"
                RESULT=$("$PYTHON" - "$CUSTOM_ENV" << 'PYEOF'
import json, os, re, sys

path = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('_CUSTOM_ENV', '')

def parse(path):
    data = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.rstrip('\n')
                s = line.strip()
                if not s or s.startswith('#'):
                    continue
                m = re.match(r'^\s*([A-Za-z0-9_]+)\s*[:=]\s*(.*)$', line)
                if m:
                    key = m.group(1)
                    val = m.group(2).strip().strip("'").strip('"')
                    data[key] = val
    except Exception:
        pass
    return data

d = parse(path)

def truthy(v):
    return str(v).strip().lower() in ('true', '1', 'yes', 'on')

# Get hostname and FQDN
hostname = ''
fqdn = ''
try:
    import socket
    hostname = socket.gethostname()
    fqdn = socket.getfqdn()
except Exception:
    pass

# Get LAN IP addresses and default gateway from /etc/nas.conf
lan_ips = {'lan1': '', 'lan2': ''}
default_gateway = ''
try:
    import configparser
    with open('/etc/nas.conf') as f:
        raw = '[__root__]\n' + f.read()
    cp = configparser.RawConfigParser()
    cp.read_string(raw)
    for s in cp.sections():
        if s.lower() == 'network':
            for k, v in cp.items(s):
                k_lower = k.lower()
                if k_lower in ('lan1ip', 'lan1_ip'): lan_ips['lan1'] = v.strip()
                if k_lower in ('lan2ip', 'lan2_ip'): lan_ips['lan2'] = v.strip()
                if k_lower in ('defaultgateway', 'default_gateway'): default_gateway = v.strip()
except Exception:
    pass

# Get IP of the default gateway interface
gateway_ip = ''
if default_gateway and default_gateway in lan_ips:
    gateway_ip = lan_ips[default_gateway]

lan_status = {
    'lan1': bool(lan_ips['lan1']),
    'lan2': bool(lan_ips['lan2'])
}

result = {
    'success': True,
    'tz':                  d.get('TZ', ''),
    'web_password':        d.get('FTLCONF_webserver_api_password', ''),
    'web_http':            d.get('WEB_HTTP', ''),
    'web_https':           d.get('WEB_HTTPS', ''),
    'tls_validity':        int(d.get('FTLCONF_webserver_tls_validity', '0')) if d.get('FTLCONF_webserver_tls_validity', '0').isdigit() else 0,
    'dhcp_passthrough':    truthy(d.get('DHCP_PASSTHROUGH', 'false')),
    'web_url_override':    d.get('WEB_URL_OVERRIDE', ''),
    'apache_proxy_enabled': os.environ.get('_APACHE_PROXY_ENABLED', 'false') == 'true',
    'hostname':            hostname,
    'fqdn':                fqdn,
    'lan_ips':             lan_ips,
    'lan_status':          lan_status,
    'gateway_ip':          gateway_ip
}
print(json.dumps(result))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            apache)
                # Read hostname, server_fqdn, redirect_to, proxy_to from Define lines
                A_HOSTNAME="pi-hole"
                A_FQDN='${hostname}.${domain}'
                A_REDIRECT='https://${server_fqdn}/'
                A_PROXY_TO='https://127.0.0.1:5011/'
                if [ -f "$APACHE_CONF_AVAILABLE" ]; then
                    EXTRACTED_H=$(grep -m1 "^Define hostname " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define hostname[ ]*//')
                    EXTRACTED_F=$(grep -m1 "^Define server_fqdn " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define server_fqdn[ ]*//')
                    EXTRACTED_R=$(grep -m1 "^Define redirect_to " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define redirect_to[ ]*//')
                    EXTRACTED_P=$(grep -m1 "^Define proxy_to " "$APACHE_CONF_AVAILABLE" 2>/dev/null | sed 's/^Define proxy_to[ ]*//')
                    [ -n "$EXTRACTED_H" ] && A_HOSTNAME="$EXTRACTED_H"
                    [ -n "$EXTRACTED_F" ] && A_FQDN="$EXTRACTED_F"
                    [ -n "$EXTRACTED_R" ] && A_REDIRECT="$EXTRACTED_R"
                    [ -n "$EXTRACTED_P" ] && A_PROXY_TO="$EXTRACTED_P"
                fi

                export _A_HOSTNAME="$A_HOSTNAME" _A_FQDN="$A_FQDN" _A_REDIRECT="$A_REDIRECT" _A_PROXY_TO="$A_PROXY_TO"
                RESULT=$("$PYTHON" - << 'PYEOF'
import json, os
print(json.dumps({
    'success': True,
    'apache_hostname': os.environ.get('_A_HOSTNAME', 'pi-hole'),
    'apache_fqdn': os.environ.get('_A_FQDN', '${hostname}.${domain}'),
    'apache_redirect_to': os.environ.get('_A_REDIRECT', 'https://${server_fqdn}/'),
    'apache_proxy_to': os.environ.get('_A_PROXY_TO', 'https://127.0.0.1:5011/')
}))
PYEOF
)
                printf 'Content-Type: application/json\r\n\r\n'
                printf '%s' "$RESULT"
                ;;

            *)
                respond '{"success":true}'
                ;;
        esac
        ;;

    set)
        PYTHON=$(find_python)
        if [ -z "$PYTHON" ]; then
            respond '{"success":false,"error_code":500,"error_msg":"No python interpreter found"}'
            exit 0
        fi
        mkdir -p "$CFG_DIR"

        case "$TAB" in
            settings)
                TZ_V=$(get_param tz)
                PASSWORD=$(get_param web_password)
                HTTP_V=$(get_param web_http)
                HTTPS_V=$(get_param web_https)
                TLS_V=$(get_param tls_validity)
                DHCP=$(get_param dhcp_passthrough)
                URL_OVERRIDE=$(get_param web_url_override)

                export _CUSTOM_ENV="$CUSTOM_ENV" _TZ="$TZ_V" _PASSWORD="$PASSWORD" \
                       _HTTP="$HTTP_V" _HTTPS="$HTTPS_V" _TLS="$TLS_V" _DHCP="$DHCP" \
                       _URL_OVERRIDE="$URL_OVERRIDE"

                "$PYTHON" - << 'PYEOF'
import os, re

path = os.environ.get('_CUSTOM_ENV', '')

updates = {
    'TZ':                              os.environ.get('_TZ', ''),
    'WEB_HTTP':                        os.environ.get('_HTTP', ''),
    'WEB_HTTPS':                       os.environ.get('_HTTPS', ''),
    'FTLCONF_webserver_api_password':  os.environ.get('_PASSWORD', ''),
    'FTLCONF_webserver_tls_validity':  os.environ.get('_TLS', '0'),
    'DHCP_PASSTHROUGH':                os.environ.get('_DHCP', 'false'),
    'WEB_URL_OVERRIDE':                os.environ.get('_URL_OVERRIDE', ''),
}

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

seen = set()

def render(key, val):
    if key.startswith('FTLCONF_'):
        return "%s: %s\n" % (key, val)
    return "%s=%s\n" % (key, val)

out = []
for line in lines:
    m = re.match(r'^\s*([A-Za-z0-9_]+)\s*[:=]', line)
    if m and m.group(1) in updates:
        key = m.group(1)
        out.append(render(key, updates[key]))
        seen.add(key)
    else:
        out.append(line)

for key, val in updates.items():
    if key not in seen:
        if out and not out[-1].endswith('\n'):
            out[-1] = out[-1] + '\n'
        out.append(render(key, val))

with open(path, 'w') as f:
    f.writelines(out)
PYEOF
                chmod 640 "$CUSTOM_ENV" 2>/dev/null

                # Rewrite compose.yml to reflect DHCP passthrough state.
                COMPOSE_YML="${CFG_DIR}/compose.yml"
                export _COMPOSE_YML="$COMPOSE_YML" _DHCP="$DHCP"
                "$PYTHON" - << 'PYEOF'
import os, re
path = os.environ.get('_COMPOSE_YML', '')
dhcp = os.environ.get('_DHCP', 'false').strip().lower() in ('true', '1', 'yes', 'on')
try:
    with open(path) as f:
        src = f.read()
except Exception:
    raise SystemExit

def toggle(text, marker_re, enable):
    def repl(m):
        line = m.group(0)
        stripped = line.lstrip()
        indent = line[:len(line)-len(stripped)]
        if enable:
            new = re.sub(r'^#\s?', '', stripped)
            return indent + new
        else:
            if stripped.startswith('#'):
                return line
            return indent + '# ' + stripped
    return re.sub(marker_re, repl, text, flags=re.MULTILINE)

src = toggle(src, r'^[ \t]*#?\s*-\s*"?67:67/udp"?.*$', dhcp)
src = toggle(src, r'^[ \t]*#?\s*-\s*NET_ADMIN\s*$',     dhcp)

with open(path, 'w') as f:
    f.write(src)
PYEOF
                # Restart the Docker container
                /usr/local/AppCentral/cappysan-pi-hole/CONTROL/start-stop.sh restart >> "$LOG" 2>&1 &
                respond '{"success":true}'
                ;;

            apache)
                APACHE_HOSTNAME=$(get_param apache_hostname)
                APACHE_FQDN=$(get_param apache_fqdn)
                APACHE_REDIRECT=$(get_param apache_redirect_to)
                APACHE_PROXY_TO=$(get_param apache_proxy_to)

                # Defaults if empty
                [ -z "$APACHE_HOSTNAME" ] && APACHE_HOSTNAME="pi-hole"
                [ -z "$APACHE_FQDN" ] && APACHE_FQDN='${hostname}.${domain}'
                [ -z "$APACHE_REDIRECT" ] && APACHE_REDIRECT='https://${server_fqdn}/'
                [ -z "$APACHE_PROXY_TO" ] && APACHE_PROXY_TO='https://127.0.0.1:5011/'

                # If file doesn't exist yet, seed it from the template
                mkdir -p "$APACHE_SITES_AVAILABLE" 2>/dev/null
                if [ ! -f "$APACHE_CONF_AVAILABLE" ]; then
                    TEMPLATE="/usr/local/AppCentral/cappysan-pi-hole/CONTROL/apache.conf"
                    if [ -f "$TEMPLATE" ]; then
                        cp "$TEMPLATE" "$APACHE_CONF_AVAILABLE"
                    fi
                fi

                # Only rewrite the four Define lines at the top
                export _A_HOSTNAME="$APACHE_HOSTNAME" _A_FQDN="$APACHE_FQDN" \
                       _A_REDIRECT="$APACHE_REDIRECT" _A_PROXY_TO="$APACHE_PROXY_TO" \
                       _CONF="$APACHE_CONF_AVAILABLE"
                "$PYTHON" - << 'PYEOF'
import os

path = os.environ.get('_CONF', '')
hostname = os.environ.get('_A_HOSTNAME', 'pi-hole')
fqdn = os.environ.get('_A_FQDN', '${hostname}.${domain}')
redirect = os.environ.get('_A_REDIRECT', 'https://${server_fqdn}/')
proxy_to = os.environ.get('_A_PROXY_TO', 'https://127.0.0.1:5011/')

try:
    with open(path) as f:
        lines = f.readlines()
except Exception:
    lines = []

out = []
for line in lines:
    if line.startswith('Define hostname '):
        out.append('Define hostname    %s\n' % hostname)
    elif line.startswith('Define server_fqdn '):
        out.append('Define server_fqdn %s\n' % fqdn)
    elif line.startswith('Define redirect_to '):
        out.append('Define redirect_to %s\n' % redirect)
    elif line.startswith('Define proxy_to '):
        out.append('Define proxy_to %s\n' % proxy_to)
    else:
        out.append(line)

with open(path, 'w') as f:
    f.writelines(out)
PYEOF

                # Create symlink (relative path) so apache picks the site up.
                # Whether the site is actually active/served is handled by
                # the cappysan-apache package itself.
                mkdir -p "$APACHE_SITES_ENABLED" 2>/dev/null
                rm -f "$APACHE_CONF_ENABLED" 2>/dev/null
                ln -s ../sites-available/pi-hole.conf "$APACHE_CONF_ENABLED" 2>/dev/null

                # Run apache reload
                APACHE_SCRIPT="/usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh"
                if [ ! -f "$APACHE_SCRIPT" ]; then
                    respond '{"success":true,"warning":"cappysan-apache package is not installed."}'
                elif ! "$APACHE_SCRIPT" reload >> "$LOG" 2>&1; then
                    respond '{"success":true,"warning":"Failed to reload cappysan-apache."}'
                else
                    respond '{"success":true}'
                fi
                ;;

            *)
                respond '{"success":true}'
                ;;
        esac
        ;;

    restart)
        /usr/local/AppCentral/cappysan-pi-hole/CONTROL/start-stop.sh restart >> "$LOG" 2>&1 &
        respond '{"success":true}'
        ;;

    *)
        respond '{"success":false,"error_code":400,"error_msg":"Unknown action"}'
        ;;
esac
exit 0
