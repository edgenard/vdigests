.PHONY: update build_production

# obtain the absolute path to the makefile dir
MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
BASE_DIR := $(realpath $(MAKEFILE_DIR))

# dirs and files ignored by gitignore
configd := $(BASE_DIR)/config
demo_secrets := $(configd)/demo-secrets.js
demo_settings := $(configd)/demo-settings.js
secrets := $(configd)/secrets.js
settings := $(configd)/settings.js

node_modules: |$(secrets) $(settings)
	npm install

$(secrets):
	cp $(demo_secrets) $(secrets)

$(settings):
	cp $(demo_settings) $(settings)

update:
	git pull
	cd submods/p2fa-vislab; git pull

build_production:
	cd public/js; r.js -o build.js
