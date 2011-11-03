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
    _INSTANCES: {},
    _HANDLER: null,
    _INTERVAL_ID: null,
    API_MODE: null,


    // video properties
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

    play: function() {this.api('play');},
    togglePlay: function() {this.api('toggle-play');},
    pause: function() {this.api('pause');},
    seek: function(time) {this.api('seek', time);},
    load: function(id) {this.api('load', id);},
    setMuted: function(muted) {this.api('muted', muted);},
    toggleMuted: function() {this.api('toggle-muted');},
    setVolume: function(volume) {this.api('volume', volume);},
    setFullscreen: function(fullscreen) {this.api('fullscreen', fullscreen);},
    watchOnSite: function(muted) {this.api('watch-on-site');},

    api: function(command, arg)
    {
        if (arg) command += '=' + arg;
        this._send(command);
    },

    create: function(element, options)
    {
        element = DM.$(element);
        if (!element || element.nodeType != 1)
            throw new Error("Invalid first argument sent to DM.player(), requires a HTML element or element id: " + element);
        if (!options || typeof options != 'object')
            throw new Error("Missing `options' parameter for DM.player()");
        if (!options.video)
            throw new Error("Missing `video' option parameter for DM.player()");

        options = DM.copy(options,
        {
            width: 480,
            height: 270,
            title: "video player",
            params: {},
            events: {}
        });

        var player = document.createElement("iframe");
        DM.Array.forEach(['id', 'style', 'class'], function(attr)
        {
            var val = element.getAttribute(attr);
            if (val) player.setAttribute(attr, val);
        });
        element.parentNode.replaceChild(player, element);
        player.setAttribute("frameborder", "0");
        player.title = "Dailymotion " + options.title;
        player.type = "text/html";
        player.width = options.width;
        player.height = options.height;

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
        DM.Player._installHandlers();
        params = typeof params == "object" ? params : {};
        params.api = DM.Player.API_MODE;
        this.id = params.id = this.id ? this.id : DM.guid();
        this.src = DM._domain.www + "/embed/video/" + video + '?' + DM.QS.encode(params);
        if (DM.Player._INSTANCES[this.id] != this)
        {
            DM.Player._INSTANCES[this.id] = this;
            this.addEventListener('unload', function() {delete DM.Player._INSTANCES[this.id];});
        }
        
        this.autoplay = DM.parseBool(params.autoplay);
    },

    _installHandlers: function()
    {
        if (window.postMessage && DM.Player.API_MODE != "fragment")
        {
            DM.Player.API_MODE = "postMessage";

            if (!DM.Player._HANDLER)
            {
                DM.Player._HANDLER = function(e)
                {
                    if (!e.origin || e.origin.indexOf(DM._domain.www) !== 0) return;
                    var event = DM.QS.decode(e.data);
                    if (!event.id || !event.event) return;
                    var player = DM.$(event.id);
                    player._recvEvent(event);
                };
                if (window.addEventListener) window.addEventListener("message", DM.Player._HANDLER, false);
                else if (window.attachEvent) window.attachEvent("onmessage", DM.Player._HANDLER);
            }
        }
        else
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

    _send: window.postMessage ? function(command)
    {
        this.contentWindow.postMessage(command, DM._domain.www);
    }
    : function(command) // fragment API mode fallback
    {
        var src = this.src, pos;
        if ((pos = src.indexOf('#')) != -1) src = src.substring(0, pos);
        this.src = src + '#' + command;
    },

    _dispatch: document.createEvent ? function(type)
    {
        var e = document.createEvent("HTMLEvents");
        e.initEvent(type, true, true);
        this.dispatchEvent(e);
    }
    : function(type) // IE compat
    {
        e = document.createEventObject();
        this.fireEvent('on'+event.event, e);
    },

    _recvEvent: function(event)
    {
        switch (event.event)
        {
            case 'loadedmetadata': this.error = null; this.ended = false; break;
            case 'timeupdate': this.currentTime = parseFloat(event.time); break;
            case 'progress': this.bufferedTime = parseFloat(event.time); break;
            case 'durationchange': this.duration = parseFloat(event.duration); break;
            case 'seeking': this.seeking = true; this.currentTime = parseFloat(event.time); break;
            case 'seeked': this.seeking = false; this.currentTime = parseFloat(event.time); break;
            case 'fullscreenchange': this.fullscreen = DM.parseBool(event.fullscreen); break;
            case 'volumechange': this.volume = parseFloat(event.volume); break;
            case 'playing':
            case 'play': this.paused = false; break;
            case 'ended': this.ended = true; break; // no break, also set paused
            case 'ended':
            case 'pause': this.paused = true; break;
            case 'error': this.error = {code: event.code, title: event.title, message: event.message}; break;
        }

        this._dispatch(event.event);
    },

    // IE compat (DM.copy won't set this if already defined)
    addEventListener: function(name, callback, capture)
    {
        if (this.attachEvent) this.attachEvent("on" + name, callback, capture);
    }
});
