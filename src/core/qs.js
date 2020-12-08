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
DM.provide('QS', {
  /**
   * Encode parameters to a query string.
   *
   * @access private
   * @param   params {Object}  the parameters to encode
   * @param   sep    {String}  the separator string (defaults to '&')
   * @param   encode {Boolean} indicate if the key/value should be URI encoded
   * @return         {String}  the query string
   */
  encode: function(params, sep, encode) {
    sep = sep === undefined ? '&' : sep;
    encode =
      encode === false
        ? function(s) {
            return s;
          }
        : encodeURIComponent;

    var pairs = [];
    DM.Array.forEach(params, function(val, key) {
      if (val !== null && typeof val != 'undefined') {
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
  decode: function(str) {
    var qsParams = str.split('&');
    var decode = decodeURIComponent;

    var params = {};

    for (var index = 0; index < qsParams.length; index += 1) {
      var delimiterIndex = qsParams[index].indexOf('=');
      if (delimiterIndex < 1) {
        continue;
      }

      // Get a list of keys and a value from a "depth1[depth2][depth3]=value" string
      var keyList = decode(qsParams[index].substring(0, delimiterIndex))
        .replace(/\]/g, '')
        .split('[');
      var value = decode(qsParams[index].substring(delimiterIndex + 1));

      // Recursively create all the intermediate objects from the keys list,
      // and set the value when done
      var destinationParam = params;
      while (keyList.length > 0) {
        var keyItem = keyList.shift();
        if (keyList.length === 0) {
          if (keyItem.length === 0) {
            destinationParam.push(value);
          } else {
            destinationParam[keyItem] = value;
          }
        } else if (typeof destinationParam[keyItem] === 'undefined') {
          destinationParam[keyItem] = keyList[0].length === 0 ? [] : {};
        }
        destinationParam = destinationParam[keyItem];
      }
    }

    return params;
  },
});
