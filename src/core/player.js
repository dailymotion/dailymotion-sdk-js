/**
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @provides dm.player
 * @requires dm.prelude
 *           dm.qs
 *           dm.xdcom
 */

/**
 * Dailymotion Player.
 *
 * @class dm
 * @static
 * @access private
 */
DM.provide('',
{
    player: function(element, options)
    {
        return DM.Player.create(element, options);
    }
});

/**
 * The Player object.
 *
 * @class DM.Player
 * @access private
 */
DM.provide('Player',
{
    _INSTANCES: {},
    _INTERVAL_ID: null,
    _PROTOCOL: null,
    API_MODE: null,
    EVENT_HANDLERS: {},

    // video properties
    apiReady: false,
    autoplay: false,
    currentTime: 0,
    bufferedTime: 0,
    duration: NaN,
    seeking: false,
    error: null,
    ended: false,
    muted: false,
    volume: 1,
    paused: true,
    fullscreen: false,
    rebuffering: false,
    qualities: [],
    quality: undefined,

    play: function() {this.api('play');},
    togglePlay: function() {this.api('toggle-play');},
    pause: function() {this.api('pause');},
    seek: function(time) {this.api('seek', time);},
    load: function(id) {this.api('load', id);},
    setMuted: function(muted) {this.api('muted', muted);},
    toggleMuted: function() {this.api('toggle-muted');},
    setVolume: function(volume) {this.api('volume', volume);},
    setQuality: function(quality) {this.api('quality', quality);},
    setFullscreen: function(fullscreen) {this.api('fullscreen', fullscreen);},
    watchOnSite: function(muted) {this.api('watch-on-site');},

    api: function(command, arg)
    {
        if(typeof arg !== 'undefined') command += '=' + arg;
        this._send(command);
    },

    create: function(element, options)
    {
        element = DM.$(element);
        if (!element || element.nodeType != 1)
            throw new Error("Invalid first argument sent to DM.player(), requires a HTML element or element id: " + element);
        if (!options || typeof options != 'object')
            throw new Error("Missing `options' parameter for DM.player()");

        options = DM.copy(options,
        {
            width: 480,
            height: 270,
            title: "video player",
            params: {},
            events: {}
        });

        // see #5 : _domain.www should be protocol independent
        // remove protocol from existing value to preserve backward compatibility
        DM._domain.www = DM._domain.www.replace(/^https?\:/, '');
        DM.Player._PROTOCOL = (window.location && /^https?:$/.test(window.location.protocol)) ? window.location.protocol : 'http:';

        var player = document.createElement("iframe");
        DM.Array.forEach(['id', 'style', 'class'], function(attr)
        {
            var val = element.getAttribute(attr);
            if (val) player.setAttribute(attr, val);
        });
        player.setAttribute("frameborder", "0");
        player.setAttribute("allowfullscreen", "true");
        player.setAttribute("webkitallowfullscreen", "true");
        player.setAttribute("mozallowfullscreen", "true");
        player.title = "Dailymotion " + options.title;
        player.type = "text/html";
        player.width = options.width;
        player.height = options.height;
        element.parentNode.replaceChild(player, element);

        DM.copy(player, DM.Player);

        player.init(options.video, options.params);

        if (typeof options.events == "object")
        {
            for (var name in options.events)
            {
                player.addEventListener(name, options.events[name], false);
            }
        }

        return player;
    },

    init: function(video, params)
    {
        var self = this;
        DM.Player._installHandlers(function()
        {
            // ask the peer to resend the apiready event in case it missed it while installing handlers
            self._send('check');
        });
        params = typeof params == "object" ? params : {};
        params.api = DM.Player.API_MODE;
        if (DM.Player.API_MODE == 'xdcom')
        {
            params.xdcomId = DM.Player.xdcomChannel.connectionId;
        }
        if (DM._apiKey)
        {
            params.apiKey = DM._apiKey;
        }
        this.id = params.id = this.id ? this.id : DM.guid();
        this.src = DM.Player._PROTOCOL + DM._domain.www + "/embed" + (video ? "/video/" + video : "") + '?' + DM.QS.encode(params);
        if (DM.Player._INSTANCES[this.id] != this)
        {
            DM.Player._INSTANCES[this.id] = this;
            this.addEventListener('unload', function() {delete DM.Player._INSTANCES[this.id];});
        }

        this.autoplay = DM.parseBool(params.autoplay);
    },

    _installHandlers: function(initedCallback)
    {
        if (DM.Player.API_MODE !== null) return;
        if (window.postMessage)
        {
            DM.Player.API_MODE = "postMessage";

            var handler = function(e)
            {
                if (!e.origin || e.origin.indexOf(DM.Player._PROTOCOL + DM._domain.www) !== 0) return;
                var event = DM.QS.decode(e.data);
                if (!event.id || !event.event) return;
                var player = DM.$(event.id);
                player._recvEvent(event);
            };
            if (window.addEventListener) window.addEventListener("message", handler, false);
            else if (window.attachEvent) window.attachEvent("onmessage", handler);
        }
        else if(DM.XDCom.capable())
        {
            DM.Player.API_MODE = "xdcom";
            DM.Player.xdcomChannel = DM.XDCom.createChannel(function(data)
            {
                var event = DM.QS.decode(data);
                if (!event.id || !event.event) return;
                var player = DM.$(event.id);
                player._recvEvent(event);
            }, initedCallback);
        }

        if (DM.Player.API_MODE === null)
        {
            DM.Player.API_MODE = "fragment";
            return; // no yet ready

            if (!DM.Player._INTERVAL_ID)
            {
                DM.Player._INTERVAL_ID = setInterval(function()
                {
                    for (var id in DM.Player._INSTANCES)
                    {
                        var player = DM.Player._INSTANCES[id], pos;
                        if ((pos = player.src.indexOf('#')) != -1)
                        {
                            var event = DM.QS.decode(src.substring(pos + 1));
                            player.src = src.substring(0, pos); // reset fragment
                            if (event.id && event.event) player._recvEvent(event);
                        }
                    }
                    if (DM.Player._INSTANCES.length === 0) clearInterval(DM.Player._INTERVAL_ID);
                }, 0);
            }
        }
    },

    _send: function(command) // fragment API mode fallback
    {
        switch (DM.Player.API_MODE)
        {
            case 'postMessage':
                this.contentWindow.postMessage(command, DM.Player._PROTOCOL + DM._domain.www);
                break;

            case 'xdcom':
                DM.Player.xdcomChannel.postMessage(this.id, command);
                break;

            case 'fragment':
                var src = this.src, pos;
                if ((pos = src.indexOf('#')) != -1) src = src.substring(0, pos);
                this.src = src + '#' + command;
                break;
        }
    },

    _dispatch: document.createEvent ? function(type)
    {
        var e = document.createEvent("HTMLEvents");
        e.initEvent(type, true, true);
        this.dispatchEvent(e);
    }
    : function(type) // IE compat
    {
        if ('on' + type in this)
        {
            e = document.createEventObject();
            this.fireEvent('on' + type, e);
        }
        else if (type in this.EVENT_HANDLERS)
        {
            var e = {type: type, target: this};
            DM.Array.forEach(this.EVENT_HANDLERS[type], function(handler)
            {
                handler(e);
            });
        }
    },

    _recvEvent: function(event)
    {
        switch (event.event)
        {
            case 'apiready': if (this.apiReady) return /* dispatch only once */; else this.apiReady = true; break;
            case 'loadedmetadata': this.error = null; this.ended = false; break;
            case 'timeupdate': // no break statement here
            case 'ad_timeupdate': this.currentTime = parseFloat(event.time); break;
            case 'progress': this.bufferedTime = parseFloat(event.time); break;
            case 'durationchange': this.duration = parseFloat(event.duration); break;
            case 'seeking': this.seeking = true; this.currentTime = parseFloat(event.time); break;
            case 'seeked': this.seeking = false; this.currentTime = parseFloat(event.time); break;
            case 'fullscreenchange': this.fullscreen = DM.parseBool(event.fullscreen); break;
            case 'volumechange': this.volume = parseFloat(event.volume); this.muted = DM.parseBool(event.muted); break;
            case 'ad_start':
            case 'ad_play':
            case 'playing':
            case 'play': this.paused = false; break;
            case 'ended': this.ended = true; break; // no break, also set paused
            case 'ad_pause':
            case 'ad_end':
            case 'ended':
            case 'pause': this.paused = true; break;
            case 'error': this.error = {code: event.code, title: event.title, message: event.message}; break;
            case 'rebuffer': this.rebuffering = DM.parseBool(event.rebuffering); break;
            case 'availablequalities': this.qualities = event.qualities; break;
            case 'qualitychange': this.quality = event.quality; break;
        }

        this._dispatch(event.event);
    },

    // IE compat (DM.copy won't set this if already defined)
    addEventListener: function(name, callback, capture)
    {
        if ('on' + name in this && this.attachEvent)
        {
            this.attachEvent("on" + name, callback, capture);
        }
        else
        {
            if (!(name in this.EVENT_HANDLERS))
            {
                this.EVENT_HANDLERS[name] = [];
            }
            this.EVENT_HANDLERS[name].push(callback);
        }
    }
});
