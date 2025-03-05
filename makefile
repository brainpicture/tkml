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
	scp dist/tkml.min.js root@prod:/var/www/tkml/tkml.min.js
	scp dist/styles.min.css root@prod:/var/www/tkml/styles.min.css

push-all: push
	# Copy nginx config directly to sites-enabled and reload nginx
	scp sites-available/tkml.app root@prod:/etc/nginx/sites-enabled/ && \
	ssh root@prod 'nginx -t && systemctl reload nginx'

.PHONY: examples examples-setup

examples-setup:
	scp sites-available/examples.tkml.app root@prod:/etc/nginx/sites-enabled/

examples:
	scp sites-available/examples.tkml.app root@prod:/etc/nginx/sites-enabled/
	ssh root@prod 'mkdir -p /var/www/tkml-examples'
	rsync -avz examples/* root@prod:/var/www/tkml-examples/