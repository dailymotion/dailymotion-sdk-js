FILES := src/third-party/json2.js src/core/prelude.js src/core/json.js src/common/array.js \
         src/core/cookie.js src/core/event.js src/core/init.js src/core/qs.js src/core/api.js \
         src/core/auth.js src/core/xdcom.js src/core/player.js
COMPRESSOR_BIN := yuicompressor
MXMLC_BIN := mxmlc

all: all.js xdcom.swf

all.js: $(FILES)
	cat $(FILES) | $(COMPRESSOR_BIN) --type js -o $@

xdcom.swf: src/core/xdcom.as
	$(MXMLC_BIN) --strict -optimize -debug=true -static-link-runtime-shared-libraries=true -o $@ -- src/core/xdcom.as

