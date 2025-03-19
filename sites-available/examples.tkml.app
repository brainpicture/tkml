# Define variable to check if client accepts TKML
map $http_accept $is_tkml {
    "application/tkml"    1;
    default              0;
}

server {
    server_name examples.tkml.app;

    root /var/www/tkml-examples;
    index index.tkml;

    # Allow ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # Handle .tkml files
    location ~ \.tkml$ {
        if ($is_tkml = 1) {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
            break;
        }
        
        add_header Cache-Control "public, max-age=31536000";
        default_type text/html;
        add_header X-Debug-Cache "Cache headers are set 2";
        return 200 '<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://tkml.app/styles.min.css">
<script src="https://tkml.app/tkml.min.js"></script>
</head><body><div id="container"></div><script>
(new TKML(document.getElementById("container"), { dark: true })).load(`$uri`);
</script></body></html>';
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/examples.tkml.app/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/examples.tkml.app/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = examples.tkml.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    server_name examples.tkml.app;
    listen 80;
    return 404; # managed by Certbot
}