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
    _IFRAME_ORIGIN: null,
    _INSTANCES: {},
    _INTERVAL_ID: null,
    _PROTOCOL: null,
    API_MODE: null,
    EVENT_HANDLERS: {},

    // video properties
    _environmentInfo: null,
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
    controls: undefined,
    rebuffering: false,
    qualities: [],
    quality: undefined,
    subtitles: [],
    subtitle: undefined,
    video: null,

    play: function() {this.api('play');},
    togglePlay: function() {this.api('toggle-play');},
    pause: function() {this.api('pause');},
    seek: function(time) {this.api('seek', time);},
    load: function(id, settings) {this.api('load', id, settings);},
    setMuted: function(muted) {this.api('muted', muted);},
    toggleMuted: function() {this.api('toggle-muted');},
    setVolume: function(volume) {this.api('volume', volume);},
    setQuality: function(quality) {this.api('quality', quality);},
    setSubtitle: function(subtitle) {this.api('subtitle', subtitle);},
    setFullscreen: function(fullscreen) {this.api('fullscreen', fullscreen);},
    setControls: function (visible) { this.api('controls', visible);},
    toggleControls: function () { this.api('toggle-controls');},
    setProp: function() {this.api.apply(this, ['set-prop'].concat([].slice.call(arguments)));}, // onsite use only
    watchOnSite: function(muted) {this.api('watch-on-site');},

    api: function(command)
    {
        var parameters = (2 <= arguments.length) ? [].slice.call(arguments, 1) : [];
        this._send(command, parameters);
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

        // Look at query-string for a "dm:params" parameter, and pass them to the player
        if (location.search.length > 1 && location.search.indexOf('dm:params') !== -1)
        {
            var params = DM.QS.decode(location.search.substr(1));
            if ('dm:params' in params)
            {
                // Decode the double encoded params
                options.params = DM.copy(DM.QS.decode(params['dm:params']), options.params);
            }
        }

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
        player.setAttribute("allow", "autoplay");
        player.title = "Dailymotion " + options.title;
        player.type = "text/html";
        player.width = options.width;
        player.height = options.height;
        element.parentNode.replaceChild(player, element);

        DM.copy(player, DM.Player);

        player.init(options.video, options.params, options.playlist);

        if (typeof options.events == "object")
        {
            for (var name in options.events)
            {
                player.addEventListener(name, options.events[name], false);
            }
        }

        return player;
    },

    _getPathname: function(video, playlist)
    {
        if (playlist) {
            return "/embed/playlist/" + playlist
        }
        if (video) {
            return "/embed/video/" + video
        }
        return "/embed"
    },

    init: function(video, params, playlist)
    {
        var self = this;
        DM.Player._installHandlers();
        params = typeof params == "object" ? params : {};
        params.api = DM.Player.API_MODE;

        // Support for old browser without location.origin
        if (location.origin)
            params.origin = location.origin;
        else
            params.origin = '*';

        if (DM._apiKey)
        {
            params.apiKey = DM._apiKey;
        }
        this.id = params.id = this.id ? this.id : DM.guid();
        this.src = DM.Player._PROTOCOL + DM._domain.www + this._getPathname(video, playlist) + '?' + DM.QS.encode(params);
        if (DM.Player._INSTANCES[this.id] != this)
        {
            DM.Player._INSTANCES[this.id] = this;
            this.addEventListener('unload', function() {delete DM.Player._INSTANCES[this.id];});
        }

        this.autoplay = DM.parseBool(params.autoplay);
    },

    _installHandlers: function()
    {
        if (DM.Player.API_MODE !== null) return;
        if (window.postMessage)
        {
            DM.Player.API_MODE = "postMessage";

            var handler = function(e)
            {
                var originDomain = e.origin ? e.origin.replace(/^https?:/, '') : null;
                if (!originDomain || originDomain.indexOf(DM._domain.www) !== 0) return;
                if (!DM.Player._IFRAME_ORIGIN) {
                  DM.Player._IFRAME_ORIGIN = e.origin
                }
                var event = DM.QS.decode(e.data);
                if (!event.id || !event.event) return;
                var player = DM.$(event.id);
                player._recvEvent(event);
            };
            if (window.addEventListener) window.addEventListener("message", handler, false);
            else if (window.attachEvent) window.attachEvent("onmessage", handler);
        }
    },

    _send: function(command, parameters)
    {
        if (!this.apiReady) {
            try {
                if (console && typeof console.warn === 'function') {
                    console.warn('Player not ready. Ignoring command : "'+command+'"');
                }
            } catch (e) {}
            return;
        }
        if (DM.Player.API_MODE == 'postMessage')
        {
            this.contentWindow.postMessage(JSON.stringify({
                command    : command,
                parameters : parameters || []
            }), DM.Player._IFRAME_ORIGIN);
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
            case 'apiready': if (this.apiReady) return /* dispatch only once */; else this.apiReady = true; this._environmentInfo = event.info || null; break;
            case 'start': this.ended = false; break;
            case 'loadedmetadata': this.error = null; break;
            case 'timeupdate': // no break statement here
            case 'ad_timeupdate': this.currentTime = parseFloat(event.time); break;
            case 'progress': this.bufferedTime = parseFloat(event.time); break;
            case 'durationchange': this.duration = parseFloat(event.duration); break;
            case 'seeking': this.seeking = true; this.currentTime = parseFloat(event.time); break;
            case 'seeked': this.seeking = false; this.currentTime = parseFloat(event.time); break;
            case 'fullscreenchange': this.fullscreen = DM.parseBool(event.fullscreen); break;
            case 'controlschange': this.controls = DM.parseBool(event.controls); break;
            case 'volumechange': this.volume = parseFloat(event.volume); this.muted = DM.parseBool(event.muted); break;
            case 'video_start':
            case 'ad_start':
            case 'ad_play':
            case 'playing':
            case 'play': this.paused = false; break;
            case 'end': this.ended = true; break; // no break, also set paused
            case 'ad_pause':
            case 'ad_end':
            case 'video_end':
            case 'pause': this.paused = true; break;
            case 'error': this.error = {code: event.code, title: event.title, message: event.message}; break;
            case 'rebuffer': this.rebuffering = DM.parseBool(event.rebuffering); break;
            case 'qualitiesavailable': this.qualities = event.qualities; break;
            case 'qualitychange': this.quality = event.quality; break;
            case 'subtitlesavailable': this.subtitles = event.subtitles; break;
            case 'subtitlechange': this.subtitle = event.subtitle; break;
            case 'videochange': this.video = { videoId: event.videoId, title: event.title}; break;
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
