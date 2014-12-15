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
 * @provides dm.qs
 * @requires dm.prelude dm.array
 */

/**
 * Query String encoding & decoding.
 *
 * @class DM.QS
 * @static
 * @access private
 */
DM.provide('QS',
{
    /**
     * Encode parameters to a query string.
     *
     * @access private
     * @param   params {Object}  the parameters to encode
     * @param   sep    {String}  the separator string (defaults to '&')
     * @param   encode {Boolean} indicate if the key/value should be URI encoded
     * @return         {String}  the query string
     */
    encode: function(params, sep, encode)
    {
        sep = sep === undefined ? '&' : sep;
        encode = encode === false ? function(s) {return s;} : encodeURIComponent;

        var pairs = [];
        DM.Array.forEach(params, function(val, key)
        {
            if (val !== null && typeof val != 'undefined')
            {
                pairs.push(encode(key) + '=' + encode(val));
            }
        });
        pairs.sort();
        return pairs.join(sep);
    },

    /**
     * Decode a query string into a parameters object.
     *
     * @access private
     * @param   str {String} the query string
     * @return      {Object} the parameters to encode
     */
    decode: function(str)
    {
        var decode = decodeURIComponent,
            params = {},
            parts  = str.split('&'),
            i,
            pair,
            key,
            val;

        for (i = 0; i < parts.length; i++)
        {
            pair = parts[i].split('=', 2);
            if (pair && pair[0])
            {
                key = decode(pair[0]);
                val = pair[1] ? decode(pair[1].replace(/\+/g, '%20')) : '';
                if (/\[\]$/.test(key))
                {
                    key = key.slice(0,-2);
                    (params[key] ? params[key] : params[key] = []).push(val);
                }
                else
                {
                    params[key] = val;
                }
            }
        }

        return params;
    }
});
