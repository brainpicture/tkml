all:
	npm run pack

dev:
	npm run dev

clean:
	rm -rf dist

push:
	# Build project
	npm run pack
	# Copy project files
	ssh root@prod 'mkdir -p /var/www/tkml'
	scp dist/index.html root@prod:/var/www/tkml/index.html

push-all: push
	# Copy nginx config directly to sites-enabled and reload nginx
	scp sites-available/tkml.app root@prod:/etc/nginx/sites-enabled/ && \
	ssh root@prod 'nginx -t && systemctl reload nginx'