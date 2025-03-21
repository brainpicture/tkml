
server {
    server_name tkml.app www.tkml.app;

    root /var/www/tkml;
    index index.html;

    # Переменная для хранения нужного файла
    set $serve_file "";

    # Allow ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # Обработка статических файлов напрямую из Nginx
    location ~* \.(js|css)$ {
        try_files $uri =404;
        expires max;
        add_header Cache-Control "public, max-age=31536000";
    }


    # Проксирование всех остальных запросов на localhost:8348
    location / {
        proxy_pass http://localhost:8348;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/tkml.app/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/tkml.app/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = tkml.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name tkml.app www.tkml.app;
    return 404; # managed by Certbot
}