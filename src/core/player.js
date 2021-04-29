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
        element = DM.$(element);
        if (!element || element.nodeType !== Node.ELEMENT_NODE)
            throw new Error("Invalid first argument sent to DM.player(), requires a HTML element or element id: " + element);
        if (!options || typeof options !== 'object')
            throw new Error("Missing 'options' parameter for DM.player()");

        if (DM.Player._INSTANCES[element.id] !== undefined) {
            element = DM.Player.destroy(element.id);
        }

        return DM.Player.create(element, options);
    },

    destroy: function(id)
    {
        if (!id) {  // destroy all players of the page
            if (DM.Array.keys(DM.Player._INSTANCES).length === 0) {
                DM.warn("DM.destroy(): no player to destroy");
                return;
            }

            for (var key in DM.Player._INSTANCES) {
                DM.Player.destroy(key);
            }
        } else {  // destroy a single player
            if (DM.Player._INSTANCES[id] === undefined) {
                DM.warn("Invalid first argument sent to DM.destroy(), requires a player id: " + id);
                return;
            }

            DM.Player.destroy(id);
        }
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
    _EVENTS: {},
    _ANCHORS: {},
    _INTERVAL_ID: null,
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
    companionAds: null,
    loop: false,
    adData: {},

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
    setAdsConfig: function (config) {this.api("set-ads-config", config);},
    watchOnSite: function(muted) {this.api('watch-on-site');},
    setLoop: function (loop) { this.api('loop', loop);},

    api: function(command)
    {
        var parameters = (2 <= arguments.length) ? [].slice.call(arguments, 1) : [];
        this._send(command, parameters);
    },

    create: function(element, options)
    {
        options = DM.copy(options,
        {
            width: 480,
            height: 270,
            title: "video player",
            referrerPolicy: null,
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

        var player = document.createElement("iframe");
        DM.Array.forEach(['id', 'style', 'class'], function(attr)
        {
            var val = element.getAttribute(attr);
            if (val) player.setAttribute(attr, val);
        });
        player.setAttribute("frameborder", "0");
        player.setAttribute("allowfullscreen", "true");
        player.setAttribute("allow", "autoplay");
        if (typeof options.referrerPolicy === 'string') {
            player.referrerPolicy = options.referrerPolicy
        }
        player.title = "Dailymotion " + options.title;
        player.type = "text/html";
        player.width = options.width;
        player.height = options.height;
        element.parentNode.replaceChild(player, element);

        DM.copy(player, DM.Player);

        player.init(options.video, options.params, options.playlist, options.events, element);

        if (typeof options.events == "object")
        {
            for (var name in options.events)
            {
                player.addEventListener(name, options.events[name], false);
            }
        }

        return player;
    },

    destroy: function(id)
    {
        var player = DM.Player._INSTANCES[id];
        var anchor = DM.Player._ANCHORS[id];

        // remove options events listeners
        DM.Array.forEach(DM.Player._EVENTS[id], function(event)
        {
            var name = DM.Array.keys(event)[0];
            player.removeEventListener(name, event[name], false);
        });

        player.parentNode.replaceChild(anchor, player);  // replace the iframe by its initial anchor
        delete DM.Player._INSTANCES[id];  // remove player instance
        delete DM.Player._ANCHORS[id];  // remove anchor of player instance
        delete DM.Player._EVENTS[id];  // remove events of player instance
        return anchor;
    },

    _getPathname: function(video, playlist)
    {
        if (playlist && !video) {
            return "/embed/playlist/" + playlist
        }
        if (video) {
            return "/embed/video/" + video
        }
        return "/embed"
    },

    init: function(video, params, playlist, events, element)
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

        if (video && playlist) {
            params.playlist = playlist;
        }

        this.id = params.id = this.id ? this.id : DM.guid();
        this.src = 'https:' + DM._domain.www + this._getPathname(video, playlist) + '?' + DM.QS.encode(params);
        if (DM.Player._INSTANCES[this.id] != this)
        {
            DM.Player._INSTANCES[this.id] = this;
            DM.Player._EVENTS[this.id] = events;
            DM.Player._ANCHORS[this.id] = element;
            this.addEventListener('unload', function() {
                delete DM.Player._INSTANCES[this.id];
                delete DM.Player._ANCHORS[this.id];
                delete DM.Player._EVENTS[this.id];
            });
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
                if (!e.data || typeof e.data !== 'string') return;
                if (!DM.Player._IFRAME_ORIGIN) {
                  DM.Player._IFRAME_ORIGIN = e.origin;
                }
                var event = DM.Player._decodePostMessage(e.data);
                if (!event.id || !event.event) return;
                var player = DM.$(event.id);
                if (!player || typeof player._recvEvent !== 'function') return;
                player._recvEvent(event);
            };
            if (window.addEventListener) window.addEventListener("message", handler, false);
            else if (window.attachEvent) window.attachEvent("onmessage", handler);
        }
    },

    _decodePostMessage: function(rawMessage)
    {
      if (rawMessage.substring(0, 1) === '{') {
        try {
          var data = JSON.parse(rawMessage);
          return data;
        }
        catch(e) {
          return {};
        }
      }
      return DM.QS.decode(rawMessage);
    },

    _send: function(command, parameters)
    {
        if (!this.apiReady) {
            DM.warn('Player not ready. Ignoring command : "'+command+'"');
            return;
        }

        if (DM.Player.API_MODE == 'postMessage')
        {
            if (!this.contentWindow || typeof this.contentWindow.postMessage !== 'function') {
                DM.warn('Player not reachable anymore. You may have destroyed it.');
                return;
            }

            this.contentWindow.postMessage(JSON.stringify({
                command    : command,
                parameters : parameters || []
            }), DM.Player._IFRAME_ORIGIN);
        }
    },

    _dispatch: document.createEvent ? function(event)
    {
        const type = event.event
        const e = document.createEvent("HTMLEvents");
        // args is set when the player emit a ad_log event with data
        if (event.event === 'ad_log' && event.args) {
          e.data = event.args;
        }
        e.initEvent(type, true, true);
        this.dispatchEvent(e);
    }
    : function(event) // IE compat
    {
        const type = event.event
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
            case 'ad_start': this.adData = event.adData;
            case 'video_start':
            case 'ad_play':
            case 'playing':
            case 'play': this.paused = false; break;
            case 'end': this.ended = true; break; // no break, also set paused
            case 'ad_end': this.adData = {};
            case 'ad_pause':
            case 'video_end':
            case 'pause': this.paused = true; break;
            case 'error': this.error = {code: event.code, title: event.title, message: event.message}; break;
            case 'rebuffer': this.rebuffering = DM.parseBool(event.rebuffering); break;
            case 'qualitiesavailable': this.qualities = event.qualities; break;
            case 'qualitychange': this.quality = event.quality; break;
            case 'subtitlesavailable': this.subtitles = event.subtitles; break;
            case 'subtitlechange': this.subtitle = event.subtitle; break;
            case 'videochange': this.video = { videoId: event.videoId, title: event.title}; break;
            case 'ad_companions': this.companionAds = event.companionAds; break;
        }

        this._dispatch(event);
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
