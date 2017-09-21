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
 * @provides dm.prelude
 */

/**
 * Prelude.
 *
 *     Namespaces are one honking great idea -- let's do more of those!
 *                                                            -- Tim Peters
 *
 * The Prelude is what keeps us from being messy. In order to co-exist with
 * arbitary environments, we need to control our footprint. The one and only
 * rule to follow here is that we need to limit the globals we introduce. The
 * only global we should every have is ``dm``. This is exactly what the prelude
 * enables us to do.
 *
 * The main method to take away from this file is `DM.copy()`_. As the name
 * suggests it copies things. Its powerful -- but to get started you only need
 * to know that this is what you use when you are augmenting the DM object. For
 * example, this is skeleton for how ``DM.Event`` is defined::
 *
 *   DM.provide('Event', {
 *     subscribe: function() { ... },
 *     unsubscribe: function() { ... },
 *     fire: function() { ... }
 *   });
 *
 * This is similar to saying::
 *
 *   DM.Event = {
 *     subscribe: function() { ... },
 *     unsubscribe: function() { ... },
 *     fire: function() { ... }
 *   };
 *
 * Except it does some housekeeping, prevents redefinition by default and other
 * goodness.
 *
 * .. _DM.copy(): #method_DM.copy
 *
 * @class DM
 * @static
 * @access private
 */
if (!window.DM)
{
    DM =
    {
        // use the init method to set these values correctly
        _apiKey: null,
        _session: null,
        _userStatus: 'unknown', // or 'notConnected' or 'connected'
        _refreshRequested: false,
        _refreshCallbacks: [],

        // logging is enabled by default. this is the logging shown to the
        // developer and not at all noisy.
        _logging: true,

        _domain:
        {
            api: 'https://api.dailymotion.com',
            www: '//www.dailymotion.com',
            cdn: '//api.dmcdn.net'
        },
        _oauth:
        {
            logoutUrl: 'https://www.dailymotion.com/oauth/logout',
            authorizeUrl: 'https://www.dailymotion.com/oauth/authorize',
            tokenUrl: 'https://graphql.api.dailymotion.com/oauth/token'
        },

        /**
         * Copies things from source into target.
         *
         * @access private
         * @param target    {Object}  the target object where things will be copied
         *                            into
         * @param source    {Object}  the source object where things will be copied
         *                            from
         * @param overwrite {Boolean} indicate if existing items should be
         *                            overwritten
         * @param tranform  {function} [Optional], transformation function for
         *        each item
         */
        copy: function(target, source, overwrite, transform)
        {
            for (var key in source)
            {
                if (overwrite || typeof target[key] === 'undefined')
                {
                    target[key] = transform ? transform(source[key]) : source[key];
                }
            }
            return target;
        },

        /**
         * Create a namespaced object.
         *
         * @access private
         * @param name {String} full qualified name ('Util.foo', etc.)
         * @param value {Object} value to set. Default value is {}. [Optional]
         * @return {Object} The created object
         */
        create: function(name, value)
        {
            var node = window.DM, // We will use 'DM' as root namespace
                nameParts = name ? name.split('.') : [],
                c = nameParts.length;
            for (var i = 0; i < c; i++)
            {
                var part = nameParts[i];
                var nso = node[part];
                if (!nso)
                {
                    nso = (value && i + 1 == c) ? value : {};
                    node[part] = nso;
                }
                node = nso;
            }
            return node;
        },

        /**
         * Copy stuff from one object to the specified namespace that
         * is DM.<target>.
         * If the namespace target doesn't exist, it will be created automatically.
         *
         * @access private
         * @param target    {Object|String}  the target object to copy into
         * @param source    {Object}         the source object to copy from
         * @param overwrite {Boolean}        indicate if we should overwrite
         * @return {Object} the *same* target object back
         */
        provide: function(target, source, overwrite)
        {
            // a string means a dot separated object that gets appended to, or created
            return DM.copy
            (
                typeof target == 'string' ? DM.create(target) : target,
                source,
                overwrite
            );
        },

        /**
         * Generates a weak random ID.
         *
         * @access private
         * @return {String} a random ID
         */
        guid: function()
        {
            return 'f' + (Math.random() * (1<<30)).toString(16).replace('.', '');
        },

        /**
         * Logs a message for the developer if logging is on.
         *
         * @access private
         * @param args {Object} the thing to log
         */
        log: function(args)
        {
            if (DM._logging)
            {
//#JSCOVERAGE_IF 0
                if (window.Debug && window.Debug.writeln)
                {
                    window.Debug.writeln(args);
                }
                else if (window.console)
                {
                    window.console.log(args);
                }
//#JSCOVERAGE_ENDIF
            }

            // fire an event if the event system is available
            if (DM.Event)
            {
                DM.Event.fire('dm.log', args);
            }
        },

        /**
         * Logs an error message for the developer.
         *
         * @access private
         * @param args {Object} the thing to log
         */
        error: function(args)
        {
//#JSCOVERAGE_IF 0
            if (window.console)
            {
                window.console.error(args);
            }
//#JSCOVERAGE_ENDIF

            // fire an event if the event system is available
            if (DM.Event)
            {
                DM.Event.fire('dm.error', args);
            }
        },

        /**
         * Shortcut for document.getElementById
         * @method $
         * @param {string} DOM id
         * @return DOMElement
         * @access private
         */
        $: function(element)
        {
            if (typeof element == "string")
            {
                element = document.getElementById(element);
            }
            return element;
        },

        parseBool: function(value)
        {
            if (value === true || value === false) return value;
            if (value === 0) return false;
            if (typeof value == 'string') return !value.match(/^(?:|false|no|off|0)$/i);
            return !!value;
        },

        type: function(obj)
        {
            if (!DM._class2type)
            {
                DM._class2type = {};
                var classes = 'Boolean Number String Function Array Date RegExp Object'.split(' ');
                for (var i = 0, l = classes.length; i < l; i++)
                {
                    var name = classes[i];
                    DM._class2type['[object ' + name + ']'] = name.toLowerCase();
                }
                DM._class2type['[object Undefined]'] = 'undefined';
            }
            return obj === null ? String(obj) : DM._class2type[Object.prototype.toString.call(obj)] || "object";
        }
    };
}
