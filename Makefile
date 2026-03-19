PARSER ?= go/gopkg.in/yaml.v3
FILE   ?= tests/01-duplicate-key.yaml
KEY    ?= lang

FILE_ABS  := $(abspath $(FILE))
FILE_DIR  := $(dir $(FILE_ABS))
FILE_NAME := $(notdir $(FILE_ABS))

_ENTRIES := $(shell jq -r '.[].dir' parsers.json)

define build_target
.PHONY: build/$(1)
build/$(1):
	docker build -t yt-$(1) $(1)
endef

define run_target
.PHONY: run/$(1)
run/$(1):
	docker run --rm -v "$(FILE_DIR):/input" yt-$(1) /input/$(FILE_NAME) $(KEY)
endef

$(foreach e,$(_ENTRIES),$(eval $(call build_target,$(e))))
$(foreach e,$(_ENTRIES),$(eval $(call run_target,$(e))))

_BUILD_TARGETS := $(foreach e,$(_ENTRIES),build/$(e))

.PHONY: build
build: $(_BUILD_TARGETS)
