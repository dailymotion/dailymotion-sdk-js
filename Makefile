PLAYER_FILES := src/core/prelude.js src/common/array.js src/core/player.js src/core/epilogue.js src/core/qs.js

FILES := src/third-party/json2.js src/core/prelude.js src/core/json.js src/common/array.js \
         src/core/cookie.js src/core/event.js src/core/init.js src/core/epilogue.js src/core/qs.js src/core/api.js \
         src/core/auth.js src/core/player.js
COMPRESSOR_BIN := yuicompressor

all: all.js player_api.js

all.js: $(FILES)
	cat $(FILES) | $(COMPRESSOR_BIN) --type js -o $@

player_api.js: $(PLAYER_FILES)
	cat $(PLAYER_FILES) | $(COMPRESSOR_BIN) --type js -o $@

