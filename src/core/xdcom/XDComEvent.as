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
    import flash.events.Event;

    public class XDComEvent extends Event
    {
        // Dispatched when a message is received from the remote flash
        public static const MESSAGE: String = 'message';

        public var data : *;

        public function XDComEvent(type : String, data : * = 0, bubbles : Boolean = false, cancelable : Boolean = false) : void
        {
            super(type, bubbles, cancelable);
            this.data = data;
        }

        override public function clone():Event
        {
            return new XDComEvent(type, this.data, bubbles, cancelable);
        }
    }
}

