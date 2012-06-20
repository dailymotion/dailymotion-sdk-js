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
    type: null,
    METHODS: ['get', 'post', 'delete'],
    _callbacks: {},
    _calls: [],

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

        DM.ApiServer.transport(path, method, params, cb);
    },

    transport: function(path, method, params, cb)
    {
        try
        {
            DM.ApiServer.xhr();
            DM.ApiServer.transport = DM.ApiServer.ajax;
            DM.ApiServer.type = 'ajax';
        }
        catch (e)
        {
            DM.ApiServer.transport = DM.ApiServer.jsonp;
            DM.ApiServer.type = 'jsonp';
        }

        DM.ApiServer.transport(path, method, params, cb);
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

        for (var param in params)
        {
            if (params.hasOwnProperty(param))
            {
                if (DM.type(params[param]) == 'array')
                {
                    params[param] = params[param].join(',');
                }
            }
        }

        // add oauth token if we have one
        if (DM.getSession)
        {
            var session = DM.getSession();
            if (session && session.access_token && !params.access_token)
            {
                params.access_token = session.access_token;
            }
        }

        var url = (DM._domain.api + '/' + path + (path.indexOf('?') > -1 ? '&' : '?') + DM.QS.encode(params));
        if (url.length > 2000)
        {
            throw new Error('JSONP only support a maximum of 2000 bytes of input.');
        }

        // this is the JSONP callback invoked by the response
        DM.ApiServer._callbacks[g] = function(response)
        {
            if(cb) cb(response);
            delete DM.ApiServer._callbacks[g];
            script.src = null;
            script.parentNode.removeChild(script);
        };

        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    /**
     * CORS Ajax Support
     *
     * @access private
     * @param path   {String}   the request path
     * @param method {String}   the http method
     * @param params {Object}   the parameters for the query
     * @param cb     {Function} the callback function to handle the response
     */
    ajax: function(path, method, params, cb)
    {
        DM.ApiServer._calls.push({path: path, method: method, params: params, cb: cb});
        DM.ApiServer.ajaxHandleQueue();
    },

    ajaxHandleQueue: function()
    {
        if (!DM.ApiServer._callTimeout && DM.ApiServer._calls.length > 0 && !DM.ApiServer._pendingCalls)
        {
            DM.ApiServer._callTimeout = setTimeout(function()
            {
                DM.ApiServer.ajaxUnqueue();
                delete DM.ApiServer._callTimeout;
            }, 0);
        }
        else if (DM.ApiServer._calls.length == 10)
        {
            // Limit of 10 calls per request reached, unqueue immediatly
            if (DM.ApiServer._callTimeout)
            {
                clearTimeout(DM.ApiServer._callTimeout);
                delete DM.ApiServer._callTimeout;
            }
            DM.ApiServer.ajaxUnqueue();
        }
    },

    ajaxUnqueue: function()
    {
        var multicall = [],
            endpoint = DM._domain.api;

        for (var i = 0, l = DM.ApiServer._calls.length; i < l; i++)
        {
            var call = DM.ApiServer._calls[i];
            multicall.push
            ({
                call: call.method.toUpperCase() + ' /' + call.path,
                args: call.params,
                id: i
            });
        }
        DM.ApiServer._pendingCalls = DM.ApiServer._calls;
        DM.ApiServer._calls = [];

        // add oauth token if we have one
        if (DM.getSession)
        {
            var session = DM.getSession();
            if (session && session.access_token)
            {
                endpoint += '?access_token=' + encodeURIComponent(session.access_token);
            }
        }

        var xhr = DM.ApiServer.xhr();
        xhr.open('POST', endpoint);
        // Lie on Content-Type to prevent from CORS preflight check
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(DM.JSON.stringify(multicall));

        xhr.onreadystatechange = function()
        {
            if (xhr.readyState == 4)
            {
                var globalError = {error: {code: 500, message: 'Invalid server response', type: 'transport_error'}};

                var responses = DM.JSON.parse(xhr.responseText);
                console.log(responses);

                if (DM.type(responses) == 'array')
                {
                    for (var i = 0, l = responses.length; i < l; i++)
                    {
                        var response = responses[i];
                            call = 'id' in response && DM.ApiServer._pendingCalls[response.id] ? DM.ApiServer._pendingCalls[response.id] : null;

                        if (!call)
                        {
                            DM.error('Response with no valid call id: ' + DM.JSON.stringify(response));
                            continue;
                        }

                        if (call.cb) call.cb(response.result ? response.result : response);
                        DM.ApiServer._pendingCalls[response.id] = null;
                    }
                }
                else if (DM.type(responses) == 'object' && 'error' in responses)
                {
                    // Global error
                    globalError = responses;
                }
                else
                {
                    DM.error('Cannot parse multicall response: ' + e + ' response data ' + xhr.responseText);
                }

                DM.Array.forEach(DM.ApiServer._pendingCalls, function(call)
                {
                    if (call && call.cb)
                    {
                        call.cb(globalError);
                    }
                });

                delete DM.ApiServer._pendingCalls;
                DM.ApiServer.ajaxHandleQueue();
            }
        };
    },

    xhr: function()
    {
        var xhr = new window.XMLHttpRequest();
        if (!('withCredentials' in xhr))
        {
            // Doesn't support CORS
            throw new Error('Browser is not CORS capable');
        }
        return xhr;
    }
});
