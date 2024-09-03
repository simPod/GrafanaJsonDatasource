CC := go
PKG_NAME := "uam_gtom"
VERSION := "1.0.0"
TRASH := dist $(PKG_NAME) *.zip

# Be sure to check https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin?current-package-manager=yarn

package: build
	mv dist/ $(PKG_NAME)
	zip $(PKG_NAME)-$(VERSION).zip $(PKG_NAME) -r
	rm -rf $(PKG_NAME)

build: frontend backend

frontend:
	yarn build

backend:
	mage -v build:linux

.PHONY: clean

clean:
	@rm -rf $(TRASH)
