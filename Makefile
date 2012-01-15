FILES := src/third-party/json2.js src/core/prelude.js src/core/json.js src/common/array.js \
         src/core/cookie.js src/core/event.js src/core/init.js src/core/qs.js src/core/api.js src/core/auth.js src/core/player.js
COMPRESSOR_BIN := yuicompressor

all.js: $(FILES)
	cat $(FILES) | $(COMPRESSOR_BIN) --type js -o $@

MXMLC_BIN := mxmlc

xdcom.swf: src/core/xdcom/*.as
	$(MXMLC_BIN) --strict -optimize -debug=false -static-link-runtime-shared-libraries=true -sp src/core/xdcom -o xdcom.swf -- src/core/xdcom/XDCom.as

