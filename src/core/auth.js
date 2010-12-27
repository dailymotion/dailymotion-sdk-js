/**
 * Highly inspired from Facebook connect JS SDK available at https://github.com/facebook/connect-js
 *
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
 *
 *
 * @provides dm.auth
 * @requires dm.prelude
 *           dm.qs
 *           dm.event
 *           dm.json
 *           dm.api
 */

/**
 * Authentication, Authorization & Sessions.
 *
 * @class dm
 * @static
 * @access private
 */
DM.provide('',
{
    getLoginStatus: function(cb)
    {
        if (cb)
        {
            cb({status: DM._userStatus, session: DM._session});
        }
    },

    getSession: function()
    {
        if ('expires' in DM._session && new Date().getTime() > DM._session.expires * 1000)
        {
            DM.Auth.setSession(null, 'notConnected');
        }

        return DM._session;
    },

    login: function(cb, opts)
    {
        // we try to place it at the center of the current window
        var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
            screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
            outerWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.documentElement.clientWidth,
            outerHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.documentElement.clientHeight - 22), // 22 = IE toolbar height
            width = 600,
            height = 420,
            left = parseInt(screenX + ((outerWidth - width) / 2), 10),
            top = parseInt(screenY + ((outerHeight - height) / 2.5), 10),
            features = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

        opts = DM.copy
        ({
            client_id: DM._apiKey,
            response_type: 'token',
            display: 'popup',
            scope: '',
            redirect_uri: document.location.href,
            state: DM.guid(),
        }, opts || {});

        var win = window.open(DM.Auth.authorizeUrl + '?' + DM.QS.encode(opts), 'dmauth', features);

        if (cb)
        {
            DM.Auth._active[opts.state] = {cb: cb, win: win};
            DM.Auth._popupMonitor();
        }
    },

    logout: function(cb)
    {
        DM.api('/logout', cb);
    }
});

/**
 * Internal Authentication implementation.
 *
 * @class DM.Auth
 * @static
 * @access private
 */
DM.provide('Auth',
{
    authorizeUrl: 'https://api.dailymotion.com/oauth/authorize',
    _active: {},


    /**
     * Check if session info are present in the URL fragment
     *
     * @access private
     */
    readFragment: function()
    {
        var fragment = window.location.hash.substr(1);
        if (window.opener && window.opener.DM.Auth.setSession && window.name == 'dmauth'
            && (fragment.indexOf('access_token=') >= 0 || fragment.indexOf('error=') >= 0))
        {
            // display none helps prevent loading of some stuff
            document.documentElement.style.display = 'none';

            var oauthResponse = DM.QS.decode(fragment);
            window.opener.DM.Auth.recvSession(oauthResponse);
        }
    },

    /**
     * Recieve the authorization server response
     *
     * @access private
     * @param session {Object}  the new Session
     */
    recvSession: function(session)
    {
        if ('error' in session)
        {
            DM.error('Received auth error `' + session.error + '\': ' + session.error_description);
        }

        if (!('state' in session))
        {
            DM.error("Received a session with not `state' field");
            return;
        }

        if (!(session.state in DM.Auth._active))
        {
            DM.error('Received a session from an inactive window');
            return;
        }

        DM.Auth._active[session.state].session = session;
    },

    /**
     * Set a new session value. Invokes all the registered subscribers
     * if needed.
     *
     * @access private
     * @param session {Object}  the new Session
     * @param status  {String}  the new status
     * @return        {Object}  the "response" object
     */
    setSession: function(session, status)
    {
        // detect special changes before changing the internal session
        var login = !DM._session && session,
            logout = DM._session && !session,
            both = false, // DM._session && session && DM._session.uid != session.uid,
            sessionChange = login || logout || (DM._session && session && DM._session.access_token != session.access_token),
            statusChange = status != DM._userStatus;

        if (session && 'expires_in' in session)
        {
            // CAVEAT: the expires here will actually only be valid on the client as end-user machines
            //         clock is rarely synced
            session.expires = Math.round(new Date().getTime() / 1000) + parseInt(session.expires_in, 10);
            delete session.expires_in;
        }

        var response =
        {
            session: session,
            status: status
        };

        DM._session = session;
        DM._userStatus = status;

        // If cookie support is enabled, set the cookie. Cookie support does not
        // rely on events, because we want the cookie to be set _before_ any of the
        // event handlers are fired. Note, this is a _weak_ dependency on Cookie.
        if (sessionChange && DM.Cookie && DM.Cookie.getEnabled())
        {
            DM.Cookie.set(session);
        }

        // events
        if (statusChange)
        {
            /**
             * Fired when the status changes.
             *
             * @event auth.statusChange
             */
            DM.Event.fire('auth.statusChange', response);
        }
        if (logout || both)
        {
            /**
             * Fired when a logout action is performed.
             *
             * @event auth.logout
             */
            DM.Event.fire('auth.logout', response);
        }
        if (login || both)
        {
            /**
             * Fired when a login action is performed.
             *
             * @event auth.login
             */
            DM.Event.fire('auth.login', response);
        }
        if (sessionChange)
        {
            /**
             * Fired when the session changes. This includes a session being
             * refreshed, or a login or logout action.
             *
             * @event auth.sessionChange
             */
            DM.Event.fire('auth.sessionChange', response);
        }

        return response;
    },

    /**
     * Start and manage the window monitor interval. This allows us to invoke
     * the default callback for a window when the user closes the window
     * directly.
     *
     * @access private
     */
    _popupMonitor: function()
    {
        // check all open windows
        for (var id in DM.Auth._active)
        {
            if ('win' in DM.Auth._active[id])
            {
                try
                {
                    // found a closed window
                    if (DM.Auth._active[id].win.closed)
                    {
                        delete DM.Auth._active[id].win;
                        DM.Auth.recvSession({error:'access_denied', error_description:'Client closed the window', state:id});
                    }
                }
                catch (e)
                {
                }
            }

            if ('session' in DM.Auth._active[id])
            {
                var callInfo = DM.Auth._active[id];
                delete DM.Auth._active[id];

                var session = callInfo.session;
                if ('access_token' in session)
                {
                    DM.Auth.setSession(session, 'connected');
                }
                else
                {
                    DM.Auth.setSession(null, 'notConnected');
                }

                if ('win' in callInfo)
                {
                    callInfo.win.close();
                }

                if ('cb' in callInfo)
                {
                    var perms = null;
                    if (DM._session && 'scope' in DM._session)
                    {
                        perms = DM._session.scope;
                    }
                    callInfo.cb({status: DM._userStatus, session: DM._session, 'perms': perms});
                }
            }
        }

        var hasActive = false;
        for (var id in DM.Auth._active)
        {
            hasActive = true;
            break;
        }
        if (hasActive && !DM.Auth._popupInterval)
        {
            // start the monitor if needed and it's not already running
            DM.Auth._popupInterval = window.setInterval(DM.Auth._popupMonitor, 100);
        }
        else if (!hasActive && DM.Auth._popupInterval)
        {
            // shutdown if we have nothing to monitor but it's running
            window.clearInterval(DM.Auth._popupInterval);
            DM.Auth._popupInterval = null;
        }
    }
});

DM.Auth.readFragment();
