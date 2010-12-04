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
 * @provides dm.cookie
 * @requires dm.prelude
 *           dm.qs
 */

/**
 * Cookie Support.
 *
 * @class DM.Cookie
 * @static
 * @access private
 */
DM.provide('Cookie',
{
    /**
     * Holds the base_domain property to match the Cookie domain.
     *
     * @access private
     * @type String
     */
    _domain: null,

    /**
     * Indicate if Cookie support should be enabled.
     *
     * @access private
     * @type Boolean
     */
    _enabled: false,

    /**
     * Enable or disable Cookie support.
     *
     * @access private
     * @param val {Boolean} true to enable, false to disable
     */
    setEnabled: function(val)
    {
        DM.Cookie._enabled = val;
    },

    /**
     * Return the current status of the cookie system.
     *
     * @access private
     * @returns {Boolean} true if Cookie support is enabled
     */
    getEnabled: function()
    {
        return DM.Cookie._enabled;
    },

    /**
     * Try loading the session from the Cookie.
     *
     * @access private
     * @return {Object} the session object from the cookie if one is found
     */
    load: function()
    {
        // note, we have the opening quote for the value in the regex, but do
        // not have a closing quote. this is because the \b already handles it.
        var cookie = document.cookie.match('\\bdms_' + DM._apiKey + '="([^;]*)\\b'),
            session;

        if (cookie)
        {
            // url encoded session stored as "sub-cookies"
            session = DM.QS.decode(cookie[1]);
            // decodes as a string, convert to a number
            session.expires = parseInt(session.expires, 10);
            // capture base_domain for use when we need to clear
            DM.Cookie._domain = session.base_domain;
        }

        return session;
    },

    /**
     * Helper function to set cookie value.
     *
     * @access private
     * @param val    {String} the string value (should already be encoded)
     * @param ts     {Number} a unix timestamp denoting expiry
     * @param domain {String} optional domain for cookie
     */
    setRaw: function(val, ts, domain)
    {
        document.cookie = 'dms_' + DM._apiKey + '="' + val + '"'
                        + (val && ts == 0 ? '' : '; expires=' + new Date(ts * 1000).toGMTString())
                        + '; path=/'
                        + (domain ? '; domain=.' + domain : '');

        // capture domain for use when we need to clear
        DM.Cookie._domain = domain;
    },

    /**
     * Set the cookie using the given session object.
     *
     * @access private
     * @param session {Object} the session object
     */
    set: function(session)
    {
        if (session)
        {
            DM.Cookie.setRaw(DM.QS.encode(session), session.expires, session.base_domain);
        }
        else
        {
            DM.Cookie.clear();
        }
    },

    /**
     * Clear the cookie.
     *
     * @access private
     */
    clear: function()
    {
        DM.Cookie.setRaw('', 0, DM.Cookie._domain);
    }
});
