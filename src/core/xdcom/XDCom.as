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
    import flash.display.LoaderInfo;
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.StatusEvent;
    import flash.net.LocalConnection;
    import flash.system.Security;

    import Api;
    import XDComEvent;

    public dynamic class XDCom extends Sprite
    {
        private var localID    : String;
        private var remoteID   : String;
        private var api        : Api;
        private var connection : LocalConnection;

        public function XDCom() : void
        {
            Security.allowDomain('*');

            this.localID    = '';
            this.remoteID   = '';
            this.api        = new Api(this);
            this.connection = new LocalConnection();

            this.addEventListener(Event.ADDED_TO_STAGE, this.addedToStageHandler);
        }

        // Handle application startup
        private function addedToStageHandler(event : Event) : void
        {
            if (this.api.setup())
            {
                var success : Boolean = true;
                success = success && this.getFlashVars();
                success = success && this.setupConnection();

                if (success)
                {
                    this.api.setReady();
                }
            }
        }

        // Gather flash vars and check if they are valid
        private function getFlashVars() : Boolean
        {
            var v : *;
            var success : Boolean = true;
            for each (var flashvar : String in ['remoteID', 'localID'])
            {
                v = LoaderInfo(this.root.loaderInfo).parameters[flashvar];
                if (v === null || v === false || typeof v != 'string' || v == '')
                {
                    success = false;
                    continue;
                }
                this[flashvar] = v;
            }
            return this.localID != '' && this.remoteID != '' && success;
        }

        // Init the connection to the LocalConnection
        private function setupConnection() : Boolean
        {
            this.connection.client = this;
            this.connection.allowDomain('*');
            this.connection.allowInsecureDomain('*');
            try
            {
                this.connection.connect('_' + this.localID);
            }
            catch (error : ArgumentError)
            {
                return false;
            }
            return true;
        }

        // Sends a message to the remote local connection
        public function postMessage(text : String = '') : void
        {
            this.connection.send('_' + this.remoteID, 'postMessageHandler', text);
        }

        // Recevies messages from the remote local connection
        public function postMessageHandler(text : String) : void
        {
            this.dispatchEvent(new XDComEvent(XDComEvent.MESSAGE, text));
        }
    }
}

