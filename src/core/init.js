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
 * JavaScript library providing Dailymtion API integration.
 *
 * @provides dm.init
 * @requires dm.prelude
 *           dm.auth
 *           dm.api
 *           dm.cookie
 */

/**
 * This is the top level for all the public APIs.
 *
 * @class DM
 * @static
 * @access public
 */
DM.provide('',
{
    init: function(options)
    {
        // only need to list values here that do not already have a falsy default.
        // this is why cookie/session/status are not listed here.
        options = DM.copy(options || {},
        {
            logging: true
        });

        DM._apiKey = options.apiKey;

        // disable logging if told to do so, but only if the url doesnt have the
        // token to turn it on. this allows for easier debugging of third party
        // sites even if logging has been turned off.
        if (!options.logging && window.location.toString().indexOf('dm_debug=1') < 0)
        {
            DM._logging = false;
        }

        if (DM._apiKey)
        {
            // store the API secret key if provided. This allow the SDK to perform refresh token queries
            DM._apiSecret = options.apiSecret || null;

            // enable cookie support if told to do so
            DM.Cookie.setEnabled(options.cookie);

            DM.Auth.readFragment();

            // if an explicit session was not given, or is not already loaded, try to _read_ an existing cookie.
            // we dont enable writing automatically, but we do read automatically.
            var session = options.session || DM.Auth._receivedSession || DM.Cookie.load();

            if (!session || !session.refresh_token) {
                var siteSession = DM.Auth.loadSiteSession();
                if (null !== siteSession) {
                    session = siteSession;
                }
            }

            if (null !== session && DM.Auth.isSessionExpired(session)) {
                DM.Auth.refreshToken(session, function() {
                    if (options.status)
                    {
                        DM.getLoginStatus();
                    }
                });
            } else {
                DM.Auth.setSession(session, session ? 'connected' : 'unknown');
            }

            // load a fresh session if requested
            if (options.status)
            {
                DM.getLoginStatus();
            }
        }
    }
});