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
    import flash.external.ExternalInterface;
    import flash.events.Event;

    import XDCom;

    public dynamic class Api
    {
        private var parent : XDCom;
        private var ready  : Boolean;

        public function Api(parent : XDCom) : void
        {
            this.parent = parent;
            this.ready  = false;
        }

        // Setup API callbacks
        public function setup() : Boolean
        {
            try
            {
                ExternalInterface.addCallback('postMessage', this.postMessage);
                ExternalInterface.addCallback('addEventListener', this.addEventListener);
            }
            catch(e : Error)
            {
                return false;
            }
            return true;
        }

        // Dispatch the ready status
        public function setReady(onReadyCallback : String) : void
        {
            this.ready = true;
            ExternalInterface.call(onReadyCallback, this.id);
        }

        // Call postMessage on the XDCom instance
        private function postMessage(text : String = '') : void
        {
            this.parent.postMessage(text);
        }

        // Listen to XDCom events
        private function addEventListener(type : String, listener : String) : void
        {
            this.parent.addEventListener(type, function(event : Event) : void
            {
                try
                {
                    ExternalInterface.call(listener, event['data']);
                }catch(e : Error){}
            });
        }
    }
}

