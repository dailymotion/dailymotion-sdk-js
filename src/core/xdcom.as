/**
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package
{
    import mx.utils.UIDUtil;
    import flash.display.LoaderInfo;
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.StatusEvent;
    import flash.net.LocalConnection;
    import flash.system.Security;
    import flash.external.ExternalInterface;
    import flash.events.Event;

    public dynamic class xdcom extends Sprite
    {
        private var connection:LocalConnection;
        private var listeners:Array;

        public function xdcom():void
        {
            Security.allowDomain('*');
            this.listeners = new Array();

            var params:Object = LoaderInfo(this.root.loaderInfo).parameters;
            var id:String = params.id ? params.id : UIDUtil.createUID();
            var readyCallback:String = params.readyCallback ? params.readyCallback : 'onDMXDComReady';

            ExternalInterface.addCallback('postMessage', this.postMessage);
            ExternalInterface.addCallback('addListener', this.addListener);

            this.connection = new LocalConnection();
            this.connection.client = this;
            this.connection.allowDomain('*');
            this.connection.allowInsecureDomain('*');
            this.connection.addEventListener(StatusEvent.STATUS, function(e:StatusEvent):void
            {
                if (e.level == 'error')
                {
                    trace('LocalConnection.send() failed');
                }
            });

            try
            {
                this.connection.connect('_' + id);
                ExternalInterface.call(readyCallback, id);
            }
            catch (e:Error)
            {
                trace(e.message);
            }
        }

        public function postMessage(remoteId:String, text:String):void
        {
            this.connection.send('_' + remoteId, 'receiveMessage', text);
        }

        public function receiveMessage(text:String):void
        {
            this.listeners.forEach(function(listener:String, index:int, array:Array):void
            {
                try
                {
                    ExternalInterface.call(listener, text);
                }
                catch(e:Error)
                {
                    trace('Error while dispatching message to listeners: ' + e.message);
                }
            });
        }

        public function addListener(listener:String):void
        {
            this.listeners.push(listener);
        }
    }
}

