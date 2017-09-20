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
     * @param immediate {Boolean} the trigger for an immediate call if needed
     */
    call: function()
    {
        var args = Array.prototype.slice.call(arguments),
            path = args.shift(),
            next = args.shift(),
            method,
            params,
            cb,
            immediate = false;

        while (typeof next !== 'undefined')
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
                params = DM.ApiServer.formatCallParams(next);
            }
            else if (type === 'boolean' && !immediate)
            {
                immediate = next;
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

        DM.ApiServer.transport(path, method, params, cb, immediate);
    },

    /**
     * Format some params for the API.
     *
     * All params will be taken as is except params.fields and params.subrequest.
     * params.fields is stringified if an array is provided to support nested request
     * params.subrequest is stringified if an object is provided and added to params.fields
     *
     *  Ex:
     *      params.fields = ['id', 'title', 'description'] becomes params.fields = 'id,title,description'
     *  Ex:
     *      params.subrequest = {
     *        'videos': {
     *            fields: ['thumbnail_120_url', 'title'],
     *            limit: 4
     *        }
     *    is added to params.fields like this:
     *        params.fields = 'id,title,description,videos.fields(thumbnail_120_url,title).limit(4)'
     *
     * @access private
     * @param params {Object}   the call parameters
     */
    formatCallParams: function(params)
    {
        var subRequests = params.subrequests,
            subRequestsParams = [],
            subRequestsStr = '';

        if (subRequests)
        {
            var subRequestsType = DM.type(subRequests);

            if (subRequestsType == 'object')
            {
                for (fieldName in subRequests)
                {
                    var subRequest = subRequests[fieldName],
                        subRequestParams = [];

                    subRequestParams.push(fieldName + '.fields(' + (subRequest.fields || []).join(',') + ')');

                    delete(subRequest.fields);

                    for (subRequestParam in subRequest)
                    {
                        subRequestParams.push(subRequestParam + '(' + subRequest[subRequestParam] + ')');
                    }

                    if (subRequestParams.length)
                    {
                        subRequestsParams.push(subRequestParams.join('.'));
                    }
                }
            }
            else
            {
                throw new Error('Unexpected type "' + subRequestsType + '" for "subrequests" parameter. Expected type: object');
            }

            delete(params.subrequests);
        }

        if (subRequestsParams.length)
        {
            subRequestsStr = subRequestsParams.join(',');
        }

        // Fix for nested request in multicall
        if (params.fields)
        {
            var fieldsType = DM.type(params.fields);

            if (fieldsType == 'array')
            {
                params.fields.push(subRequestsStr);
                params.fields = params.fields.join(',');
            }
            else if (fieldsType == 'string')
            {
                if (params.fields.length)
                {
                    params.fields += ',' + subRequestsStr;
                }
                else
                {
                    params.fields = subRequestsStr;
                }
            }
            else
            {
                throw new Error('Unexpected type "' + fieldsType + '"  for "fields" parameter, Allowed types: array, string');
            }
        }
        else if (subRequestsStr)
        {
            params.fields = subRequestsStr;
        }

        return params;
    },

    getSimpleCallURL: function(path, params)
    {
        var encodedParams = DM.QS.encode(params),
            urlQueryParams = encodedParams.length ? (path.indexOf('?') > -1 ? '&' : '?') + encodedParams : '';

        return DM._domain.api + '/' + path + urlQueryParams;
    },

    transport: function(path, method, params, cb, immediate)
    {
        try
        {
            // throw new Error();
            DM.ApiServer.xhr();
            DM.ApiServer.transport = DM.ApiServer.ajax;
            DM.ApiServer.type = 'ajax';
        }
        catch (e)
        {
            DM.ApiServer.transport = DM.ApiServer.jsonp;
            DM.ApiServer.type = 'jsonp';
        }

        DM.ApiServer.transport(path, method, params, cb, immediate);
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
            script = document.createElement('script'),
            callTimeout,
            timeout = 5; // 5 secs

        // jsonp needs method overrides as the request itself is always a GET
        params.method = method;
        params.callback = 'DM.ApiServer._callbacks.' + g;

        var session = DM.getSession();

        // add oauth token if we have one
        if (session && session.access_token && !params.access_token)
        {
            params.access_token = session.access_token;
        }

        params = DM.Array.flatten(params);

        var url = DM.ApiServer.getSimpleCallURL(path, params);

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
            if (callTimeout)
            {
                clearTimeout(callTimeout);
                callTimeout = null;
            }
        };

        script.async = true;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);

        // Only way to report error about script loading - we use a timeout at 5 secs.
        callTimeout = setTimeout(function()
        {
            DM.ApiServer._callbacks[g]({error: {code: 500, message: 'The request has timed out', type: 'transport_error'}});
        }, timeout * 1000);
    },

    /**
     * CORS Ajax Support
     *
     * @access private
     * @param path   {String}   the request path
     * @param method {String}   the http method
     * @param params {Object}   the parameters for the query
     * @param cb     {Function} the callback function to handle the response
     * @param immediate {Boolean} the trigger for an immediate call if needed
     */
    ajax: function(path, method, params, cb, immediate)
    {
        var call = {path: path, method: method, params: params, cb: cb};

        if(!immediate)
        {
            DM.ApiServer._calls.push(call);
            DM.ApiServer.ajaxHandleQueue();
        }
        else
        {
            DM.ApiServer.performSimpleCall(path, method, params, cb);
        }
    },

    ajaxHandleQueue: function()
    {
        if (!DM.ApiServer._callTimeout && DM.ApiServer._calls.length > 0)
        {
            DM.ApiServer._callTimeout = setTimeout(function()
            {
                DM.ApiServer.performMultipleCalls(DM.ApiServer._calls);
                DM.ApiServer._calls = [];
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
            DM.ApiServer.performMultipleCalls(DM.ApiServer._calls);
            DM.ApiServer._calls = [];
        }
    },

    performSimpleCall: function(path, method, params, cb)
    {
        if (DM.Auth.isSessionExpired()) {
            // If the session is expired
            DM.Auth.refreshToken(DM._session, function (result) {
                if (result.error) {
                    if (cb)
                    {
                        cb(result);
                    }
                    return;
                }
                DM.ApiServer.performSimpleCall(path, method, params, cb);
            });
            return;
        }

        var session = DM.getSession();
        // add oauth token if we have one
        if (session && session.access_token && !params.access_token)
        {
            params.access_token = session.access_token;
        }

        params = DM.Array.flatten(params);

        var url = DM.ApiServer.getSimpleCallURL(path, params);

        var xhr = DM.ApiServer.xhr();
        xhr.open(method, url);
        // Lie on Content-Type to prevent from CORS preflight check
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send();

        xhr.onreadystatechange = function()
        {
            if (xhr.readyState == 4)
            {
                var globalError = {error: {code: 500, message: 'Invalid server response', type: 'transport_error'}},
                    response;

                if (xhr.status)
                {
                    try
                    {
                        response = DM.JSON.parse(xhr.responseText);
                    } catch(e) {}
                }

                if (DM.type(response) != 'object')
                {
                    response = globalError;
                    DM.error('Cannot parse call response data ' + xhr.responseText);
                }

                if (cb)
                {
                    cb(response);
                }
            }
        };
    },
    performMultipleCalls: function(calls)
    {
        var multicall = [],
            endpoint = DM._domain.api;

        for (var i = 0, l = calls.length; i < l; i++)
        {
            var call = calls[i];
            multicall.push
            ({
                call: call.method.toUpperCase() + ' /' + call.path,
                args: call.params,
                id: i
            });
        }

        if (DM.Auth.isSessionExpired()) {
            // If the session is expired
            DM.Auth.refreshToken(DM._session, function (result) {
                if (result.error) {
                    DM.Array.forEach(calls, function(call)
                    {
                        if (call && call.cb)
                        {
                            call.cb(result);
                        }
                    });

                    return;
                }
                DM.ApiServer.performMultipleCalls(calls);
            });
            return;
        }

        var session = DM.getSession();
        // add oauth token if we have one
        if (session && session.access_token)
        {
            endpoint += '?access_token=' + encodeURIComponent(session.access_token);
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
                var globalError = {error: {code: 500, message: 'Invalid server response', type: 'transport_error'}},
                    responses;

                if (xhr.status)
                {
                    try
                    {
                        responses = DM.JSON.parse(xhr.responseText);
                    } catch(e) {}
                }

                var responseType = DM.type(responses);

                if (responseType == 'array')
                {
                    for (var i = 0, l = responses.length; i < l; i++)
                    {
                        var response = responses[i];
                            call = 'id' in response && calls[response.id] ? calls[response.id] : null;

                        if (!call)
                        {
                            DM.error('Response with no valid call id: ' + DM.JSON.stringify(response));
                            continue;
                        }

                        if (call.cb)
                        {
                            if ('result' in response)
                            {
                                call.cb(response.result);
                            }
                            else if ('error' in response)
                            {
                                call.cb({error: response.error}); // cleans the call id or other unwanted stuff
                            }
                            else
                            {
                                call.cb({error: {code: 500, message: 'Missing result or error key', type: 'transport_error'}});
                            }
                        }
                        calls[response.id] = null;
                    }
                }
                else if (responseType == 'object' && 'error' in responses)
                {
                    // Global error
                    globalError = responses;
                }
                else
                {
                    DM.error('Cannot parse multicall response data ' + xhr.responseText);
                }

                DM.Array.forEach(calls, function(call)
                {
                    if (call && call.cb)
                    {
                        call.cb(globalError);
                    }
                });
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
