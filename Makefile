# -*- mode: makefile -*-

VERSION = `git rev-parse --short HEAD`
TO := _

ifdef BUILD_NUMBER
NUMBER = $(BUILD_NUMBER)
else
NUMBER = 1
endif

ifdef JOB_BASE_NAME
PROJECT_ENCODED_SLASH = $(subst %2F,$(TO),$(JOB_BASE_NAME))
PROJECT = $(subst /,$(TO),$(PROJECT_ENCODED_SLASH))
# Run on CI
COMPOSE = docker-compose -f docker-compose.yml -f docker-compose.ci.yml -p dailymotionsdkjs_$(PROJECT)_$(NUMBER)
else
# Run Locally
COMPOSE = docker-compose -p dailymotionsdkjs
endif

.PHONY: init
init:
	# This following command is used to provision the network
	$(COMPOSE) up --no-start --no-build app | true

.PHONY: build
build:
	$(COMPOSE) build app
	$(COMPOSE) up app

.PHONY: down
down:
	$(COMPOSE) down --volumes
