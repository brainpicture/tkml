.PHONY: push push-all

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
	rsync -avz dist/* root@prod:/var/www/tkml/

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