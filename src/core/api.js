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
 * Contains the public method ``DM.api`` and the internal implementation
 * ``DM.ApiServer``.
 *
 * @provides dm.api
 * @requires dm.prelude
 *           dm.qs
 *           dm.json
 *           dm.array
 */

/**
 * API calls.
 *
 * @class DM
 * @static
 * @access private
 */
DM.provide('',
{
    api: function()
    {
        DM.ApiServer.call.apply(DM.ApiServer, arguments);
    }
});

/**
 * API call implementations.
 *
 * @class DM.ApiServer
 * @access private
 */
DM.provide('ApiServer',
{
    METHODS: ['get', 'post', 'delete'],
    endpoint: DM._domain.api + '/',
    _callbacks: {},

    /**
     * Make a API call to Dailymotion's RESTful API.
     *
     * Except the path, all arguments to this function are optional. So any of
     * these are valid:
     *
     *   DM.api('/me') // throw away the response
     *   DM.api('/me', function(r) { console.log(r) })
     *   DM.api('/me', { fields: 'email' }); // throw away response
     *   DM.api('/me', { fields: 'email' }, function(r) { console.log(r) });
     *   DM.api('/12345678', 'delete', function(r) { console.log(r) });
     *   DM.api(
     *     '/me/feed',
     *     'post',
     *     { body: 'hi there' },
     *     function(r) { console.log(r) }
     *   );
     *
     * @access private
     * @param path   {String}   the url path
     * @param method {String}   the http method
     * @param params {Object}   the parameters for the query
     * @param cb     {Function} the callback function to handle the response
     */
    call: function()
    {
        var args = Array.prototype.slice.call(arguments),
            path = args.shift(),
            next = args.shift(),
            method,
            params,
            cb;

        while (next)
        {
            var type = typeof next;
            if (type === 'string' && !method)
            {
                method = next.toLowerCase();
            }
            else if (type === 'function' && !cb)
            {
                cb = next;
            }
            else if (type === 'object' && !params)
            {
                params = next;
            }
            else
            {
                DM.log('Invalid argument passed to DM.api(): ' + next);
                return;
            }
            next = args.shift();
        }

        method = method || 'get';
        params = params || {};

        // remove prefix slash if one is given, as it's already in the base url
        if (path[0] === '/')
        {
            path = path.substr(1);
        }

        if (DM.Array.indexOf(DM.ApiServer.METHODS, method) < 0)
        {
            DM.log('Invalid method passed to DM.api(): ' + method);
            return;
        }

        DM.ApiServer.oauthRequest(path, method, params, cb);
    },

    /**
     * Add the oauth parameter, and fire off a request.
     *
     * @access private
     * @param path   {String}   the request path
     * @param method {String}   the http method
     * @param params {Object}   the parameters for the query
     * @param cb     {Function} the callback function to handle the response
     */
    oauthRequest: function(path, method, params, cb)
    {
        // add oauth token if we have one
        if (DM.getSession)
        {
            var session = DM.getSession();
            if (session && session.access_token && !params.access_token)
            {
                params.access_token = session.access_token;
            }
        }

        DM.ApiServer.jsonp(path, method, DM.JSON.flatten(params), cb);
    },

    /**
     * Basic JSONP Support.
     *
     * @access private
     * @param path   {String}   the request path
     * @param method {String}   the http method
     * @param params {Object}   the parameters for the query
     * @param cb     {Function} the callback function to handle the response
     */
    jsonp: function(path, method, params, cb)
    {
        var g = DM.guid(),
            script = document.createElement('script');

        // jsonp needs method overrides as the request itself is always a GET
        params.method = method;
        params.callback = 'DM.ApiServer._callbacks.' + g;

        var url = (DM.ApiServer.endpoint + path + (path.indexOf('?') > -1 ? '&' : '?') + DM.QS.encode(params));
        if (url.length > 2000)
        {
            throw new Error('JSONP only support a maximum of 2000 bytes of input.');
        }

        // this is the JSONP callback invoked by the response
        DM.ApiServer._callbacks[g] = function(response)
        {
            cb && cb(response);
            delete DM.ApiServer._callbacks[g];
            script.src = null;
            script.parentNode.removeChild(script);
        };

        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }
});
