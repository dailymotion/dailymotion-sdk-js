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
 * @provides dm.xdcom
 * @requires dm.prelude
 */

/**
 * @class DM.XDCom
 * @access private
 */
DM.provide('XDCom',
{
    _swfPath: '/xdcom.swf',

    createChannel: function(messageHandler, initedCallback)
    {
        if (!DM.XDCom.capable()) return;

        var html = '',
            id = DM.guid(),
            flashvars = 'id=' + id;

        if (navigator.plugins && navigator.mimeTypes && navigator.mimeTypes.length) // Netscape plugin architecture
        {
            html = '<embed type="application/x-shockwave-flash"' +
                         ' id="DMXDCom" width=0 height=0' +
                         ' src="' + DM._domain.cdn + DM.XDCom._swfPath + '"' +
                         ' flashvars="' + flashvars + '"' +
                         ' allowscriptaccess="always"></embed>';
        }
        else
        {
            html = '<object id="DMXDCom" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
                   '  <param name="movie" value="' + DM._domain.cdn + DM.XDCom._swfPath + '"></param>' +
                   '  <param name="flashvars" value="' + flashvars + '"></param>' +
                   '  <param name="allowScriptAccess" value="always"></param>' +
                   '</object>';
        }

        var xdcom,
            container = document.createElement('div'),
            style = container.style;
        style.position = 'absolute';
        style.top = '-10000px';
        style.width = style.height = 0;
        document.body.appendChild(container);

        window.onDMXDComMessage = messageHandler;
        window.onDMXDComReady = function()
        {
            xdcom.addListener('onDMXDComMessage');
            if (initedCallback) initedCallback();
        };

        container.innerHTML = html;
        xdcom = document.getElementById('DMXDCom');
        xdcom.connectionId = id;

        return xdcom;
    },

    capable: function()
    {
        if (!('_capable' in DM.XDCom))
        {
            DM.XDCom._capable = DM.XDCom.getFlashVersion().split(',').shift() >= 9;
        }
        return DM.XDCom._capable;
    },

    getFlashVersion: function getFlashVersion()
    {
        try
        {
            try
            {
                var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
                try {axo.AllowScriptAccess = 'always';} catch(e) {return '6,0,0';}
            }
            catch(e) {}

            return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
        }
        catch(e)
        {
            try
            {
                if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin)
                {
                    return (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
                }
            }
            catch(e) {}
        }

        return '0,0,0';
    }
});
