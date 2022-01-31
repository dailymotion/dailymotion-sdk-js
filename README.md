⚠️WARNING⚠️

Please be aware we are in the process of discontinuing support for this product. We recommend all partners to utilize our new standard embed method and library. All documentation can be found in the official developer doc [here](https://developer.dailymotion.com/player/#embed-website).


See documentation at https://developer.dailymotion.com/tools/sdks#sdk-javascript

Please, don't host this script by yourself, always prefer http://api.dmcdn.net/all.js.
We only provide this github project for you to understand what you'll embed in your pages.

# Js SDK

- [Embed the player {#embedding}](#embed-the-player---embedding-)
  * [Overview](#overview)
- [Integration methods {#embed-website}](#integration-methods---embed-website-)
  * [iFrame {#player-html}](#iframe---player-html-)
    + [How to use {#player-how-to}](#how-to-use---player-how-to-)
    + [Best practices {#player-best-practices}](#best-practices---player-best-practices-)
  * [Web SDK (JavaScript) {#embed-sdk-js}](#web-sdk--javascript----embed-sdk-js-)
    + [When to use {#embed-sdk-js-when}](#when-to-use---embed-sdk-js-when-)
    + [How to use (3 steps) {#embed-sdk-js-how-to}](#how-to-use--3-steps----embed-sdk-js-how-to-)
    + [Best practices {#embed-sdk-js-best-practices}](#best-practices---embed-sdk-js-best-practices-)

- [JavaScript Player API Reference {#player-api}](#javascript-player-api-reference---player-api-)
  * [Methods {#player-api-methods}](#methods---player-api-methods-)
  * [Events {#player-api-events}](#events---player-api-events-)
    + [Player events {#player-api-events-player}](#player-events---player-api-events-player-)
    + [Video events {#player-api-events-video}](#video-events---player-api-events-video-)
    + [Ad events {#player-api-events-ad}](#ad-events---player-api-events-ad-)
  * [Player Properties {#player-api-properties}](#player-properties---player-api-properties-)
  * [Player Parameters {#player-parameters}](#player-parameters---player-parameters-)

## Embed the player {#embedding}

### Overview

The Dailymotion Player is a state-of-the-art video player built with the latest web technologies (HTML5/ JavaScript) and video standards (HLS adaptive streaming).

It's easy to use, cross-platform and enjoyed by millions of users every day, both on Dailymotion's properties and hundreds of premium Partners' websites and native applications.

The Dailymotion Player is fully customizable, consistent on all devices and delivered with picture-in-picture, analytics and advertising solutions out of the box.

To get the full feature list please visit our [dedicated page](https://www.dailymotion.com/dm/partner/player) or try the live player demo in our [player playground.](https://www.dailymotion.com/dm/partner/demo)

## Integration methods {#embed-website}

Depending on your needs, you can either embed the player using an iframe, or use our dedicated Web or Mobile SDKs for complete control of the user experience.

### Web SDK (JavaScript) {#embed-sdk-js}
The Web SDK provides access to the Player API for full control of the player on your website or applications. It's even possible to remove the default controls and develop your own, for a completely custom look and feel.

#### When to use {#embed-sdk-js-when}
The Web SDK is recommended when you need advanced customization, specific behaviour based on user interactions, or direct access to player events.

#### How to use (3 steps) {#embed-sdk-js-how-to}
1. Add the Dailymotion SDK library to your HTML page.
    
    ```html
    <script src="https://api.dmcdn.net/all.js"></script>
    ```

2. Add a placeholder `div` with an `ID` attribute on the page where you want the player to be injected.
    
    ```html
    <body>
        <div id="player"></div>
    </body>
    ```

3. Use the `DM.player()` method to create a player instance. The SDK will take care of generating and injecting an `iframe` into the placeholder `div`.
    
    ```js
    var player = DM.player(document.getElementById("player"),{ 
	    video: "x7tgad0", 
	    width: "100%", 
	    height: "100%", 
		params: { 
			autoplay: true, 
            mute: true 
        } 
    }); 
    ```

You now have full access to the Player API including all events, properties and methods. Check out our Player API Reference [here](#player-api).

#### Best practices {#embed-sdk-js-best-practices}

**Player Ready:**  
You should wait for the [apiready](#player-api-events-apiready) event before calling any API method. The player can only execute API commands once this event has been triggered.

```js
player.addEventListener('apiready', function(){
  console.log('Player API ready');
});
```

**Destroy method:**  
There may be situations where you want to remove the player `iframe` from the page (e.g. single page applications). Pass the player `div` ID to the destroy method.

```js
player.destroy('player');
```

**Correctly use player params:**  
To customize the player with the Web SDK, add any available parameters to the `params` object in your player variable. Please find the full list of available parameters here.

```js
var player = DM.player(document.getElementById("player"),{ 
	video: "x7tgad0",
	width: "100%",
	height: "100%",
	params: {
		"autoplay": true,
		"mute": true,
		"ui-highlight": "fff",
		"logo" : true
	} 
});
```


### Look & feel {#player-customisation-look}

#### Basic {#player-customisation-look-basic}
- In the Partner HQ within the "Embeds" section, you can customize the main appearance (brand logo, player accent color, video title and other player components) via some WYSIWYG tools.
- At the `iframe` embed level you can add dedicated parameters to the `src` URL field in order to enable/disable or modify some specific [properties](#player-parameters).

_Available features_:

|         Feature         | Partner HQ  | Player Embed |
|:------------------------|:-----------:|:------------:|
| Thumbnail               |      ✔      |              |
| Title info              |      ✔      |              |
| Title display           |             |       ✔      |
| Language                |      ✔      |              |
| Geoblocking             |      ✔      |              |
| Monetization            |      ✔      |              |
| Playnext                |      ✔      |              |
| Logo                    |      ✔      |       ✔      |
| Logo link               |      ✔      |              |
| Player highlight colour |      ✔      |       ✔      |
| Share button            |      ✔      |       ✔      |
| Twitter share signature |      ✔      |              |
| Autoplay                |      ✔      |       ✔      |
| Player UI display       |             |       ✔      |
| Mute                    |             |       ✔      |
| Video quality           |             |       ✔      |
| Queue                   |             |       ✔      |
| Start time              |             |       ✔      |
| Publication period      |      ✔      |              |
| Subtitles               |      ✔      |       ✔      |
| Playlist                |      ✔      |       ✔      |
| Picture-in-Picture      |      ✔      |              |
| Scroll-to-Play          |      ✔      |              |
| Loop          |          |      ✔  |

#### Advanced {#player-customisation-look-advanced}
Our Web SDK and Player API are the to-go tools to take full control of the player. You can control not only the behavior of the player but get access to all the properties and methods of the player.

### Autoplay {#player-customisation-autoplay}
In recent years, browsers on desktop and mobile have been setting stricter autoplaying polices. Although you can activate the autoplay behavior in the player's configuration, complete control over autoplay behavior isn't possible, due to users' browser settings.  

To set a video to autoplay, set the `autoplay` parameter to `true` in your player configuration.  

Our smart autoplay strategy is engineered to maximize the chances of playing a video in all browser's conditions. When autoplay is enabled, the player goes through the following waterfall:  

1. If the browser allows autoplay, the video is played automatically with sound.

2. If this isn't possible, it attempts to autoplay the video again but muted. In this case on mobile devices, the player will also automatically display a **Tap to unmute** call to action that allows users to unmute the content with a single tap anywhere on the player.

3. Finally, if the browser doesn't allow autoplay at all, the player will display a start screen and wait for the user's interaction to start video playback.

## JavaScript Player API Reference {#player-api}

Our Player API allows you to interact with and take complete control of the Dailymotion video player. It can be accessed through our SDKs and provides access to all the player methods, events and properties. Our APIs allow you to create a unique and personalized experience.

### Methods {#player-api-methods}
Before sending any API commands to a player instance, you should wait for the `apiready` player event to be fired.

|                   Method                  |                                                       Info                                                       |                        Example                        |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| `DM.player()`                             | Create a player instance. The SDK will take care of generating and injecting an iframe into the div placeholder  | DM.player(document.getElementById("player")           |
| `load(String)`                            | Load the player with a video ID (e.g. x7tgad0)                                                                    | player.load("x7tgad0")                                 |
| `load({video: String, playlist: String, autoplay : Boolean, start : Float})` | Load the player with a video and configure other runtime time parameters                                   | player.load( {video: "x7tgad0", playlist: "x5zhzj", autoplay:false, start: 5}) |
| `play()`                                  | Start or resume video playback                                                                                   | player.play()                                         |
| `pause()`                                 | Pause video playback                                                                                             | player.pause()                                        |
| `setVolume(Float)`                        | Set the player's volume to the specified level between 0 & 1. ie, 0.5 = 50%                                      | player.setVolume(0.5)                                 |
| `setSubtitles(String)`                    | Activate subtitles track to a specified language if available                                                    | player.setSubtitle('fr')                              |
| `seek(Float)`                            | Seek to the specified time in video playback in seconds                                                          | player.seek(30)                                       |
| `setQuality(String)`                      | Set the video's quality to the specified quality ['240', '380', '480', '720', '1080', '1440', '2160' 'default']  | player.setQuality('720')                              |
| `setMuted(Boolean)`                        | Enable or disable mute                                                                                           | player.setMuted(true)                                 |
| `setFullscreen(Boolean)`                         | Enable or disable fullscreen mode                                                                                | player.setFullscreen(true)                            |
| `setControls(Boolean)`                    | Enable or disable the player's controls UI                                                                       | player.setControls(false)                             |
| `togglePlay()`                            | Switch the player's playback state between play/pause                                                            | player.togglePlay()                                   |
| `toggleControls()`                        | Switch the player's controls UI between enabled/disabled                                                         | player.toggleControls()                               |
| `toggleMuted()`                           | Switch the player's Mute state between muted/unmuted                                                             | player.toggleMuted()                                  |
| `watchOnSite()`                           | Redirect to watch video on Dailymotion.com                                                                       | player.watchOnSite()                                  |
| `setAdsConfig()`                           | Dynamically update the advertising parameter value, use the method to send a new value which then gets updated when the player loads the next video file                                                                       | player.setAdsConfig({ads_params: "your_ads_params"})                                  |

### Events {#player-api-events}

The player emits events relating to the change of the player state, video playback and ad content. To listen to specific player events, you must integrate the player using our SDKs.  

#### Player events {#player-api-events-player}

| Player event       | Description                                                                                                                                                                                                                                                                                                                                                     |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `apiready`         | Sent when the player is ready to accept API commands. Do not try to call functions before receiving this event                                                                                                                                                                                                                                                  |
| `controlschange`   | Sent when the availability to use our player controls changes (visible or hidden)                                                                                                                                                                                                                                                                               |
| `start`            | Sent the first time the player attempts to start the playback, either because of user interaction, an autoplay parameter or an API call (e.g play(), load(), etc.)                                                                                                                                                                                              |
| `end`              | Sent when playback of the content video, and eventual post-roll ad video, is completed                                                                                                                                                                                                                                                                          |
| `ended`            | Deprecated. Use video_end instead                                                                                                                                                                                                                                                                                                                               |
| `error`            | Sent when the player triggers an error. Please see error codes [here](https://developer.dailymotion.com/api/#access-error)                                                                                                                                                                                                                                                                                                 |
| `fullscreenchange` | Sent when the player enters or exits the fullscreen state                                                                                                                                                                                                                                                                                                       |
| `playback_ready`   | Sent every time a video is ready to play, or started playing (depending on autoplay settings, and their resolution by the browser), or is unable to play (blocked, restricted, unavailable). Listen to this event if you want to defer doing network-heavy and JavaScript-heavy work, to allow the optimal delivery of the first frames of the video to the use |
| `seeking`          | Sent when the player starts to seek to another position in the video timeline                                                                                                                                                                                                                                                                                   |
| `seeked`           | Sent when the player has completed a seeking operation                                                                                                                                                                                                                                                                                                          |
| `videochange`      | Sent when a new video has been loaded in the player. (e.g. after calling load(videoId, [params]), or at player start-up)                                                                                                                                                                                                                                        |
| `volumechange`     | Sent when the volume or mute state changes                                                                                                                                                                                                                                                                                                                      |

#### Video events {#player-api-events-video}

|      Video event     |                                                           Description                                                           |
|:---------------------|:--------------------------------------------------------------------------------------------------------------------------------|
| `video_start`        | Sent when the player begins playback of the content video                                                                       |
| `video_end`          | Sent when the player completes playback of the content video                                                                    |
| `pause`              | Sent when the video playback has paused                                                                                         |
| `play`               | Sent when the playback state of the content video is no longer paused, as a result of the play method or the autoplay attribute |
| `playing`            | Sent when the content video starts playing, after the play or waiting event                                                     |
| `durationchange`     | Sent when the duration property of the video becomes available or changes after a new video load                                |
| `loadedmetadata`     | Sent when the video's metadata is loaded                                                                                        |
| `waiting`            | Sent when the player has to temporarily stop video playback for further buffering of content                                    |
| `subtitlechange`     | Sent when the current subtitle changes                                                                                          |
| `subtitlesavailable` | Sent when subtitles are available, wait until the `apiready` event to set subtitle via the API                                  |
| `qualitiesavailable` | Sent when video qualities are available                                                                                         |
| `qualitieschanged`   | Sent when the video quality changes                                                                                             |
| `timeupdate`         | Sent when the playback position changes                                                                                         |
| `progress`           | Sent when the browser is fetching the media data                                                                                |
| `playback_resolution `           | Sent each time any playback request has failed or if the initial playback attempt has succeeded.  On dispatch the status and reason values can be accessed from the `data.detail` object.                                                                                |

#### Ad events {#player-api-events-ad}

| Ad event        | Description                                                                                                                                                                                                                                                                          |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ad_start`      | Sent when the player begins playback of an ad video                                                                                                                                                                                                                                  |
| `ad_end`        | Sent when the player completes playback of an ad video                                                                                                                                                                                                                               |
| `ad_pause`      | Sent when the player pauses an ad                                                                                                                                                                                                                                                    |
| `ad_play`       | Sent when the ad playback starts                                                                                                                                                                                                                                                     |
| `ad_timeupdate` | Sent when the playback position of an ad changes                                                                                                                                                                                                                                     |
| `ad_companions` | Sent when a companion ad is received. Companion ads should be played in sync with the main ad (linear/non-linear) by listening to events ad_start and ad_end  |
| `ad_click` |  Sent when a user clicks on a video ad  |
| `ad_loaded ` |  Sent when the player has loaded an advertisement in full or to the extent it can begin playback|
| `ad_impression ` |   Sent when the first frame of the advertisement has been displayed |
| `ad_bufferStart ` |  Sent when the advertising playback has stopped due to buffering |
| `ad_bufferFinish ` |  Sent when the advertising playback has resumed due to the end of buffering
 |





```js
//An example listener to check if the player is ready to accept API commands
player.addEventListener('apiready', function(){
	console.log('Player Ready'); 
});
```

### Player Properties {#player-api-properties}

The player API grants access to information about the player's current state and specific properties.

| Property       | Info                                                                                                                                                              | Type    |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `bufferedTime` | The part of the media resource that has been downloaded in seconds.                                                                                               | Number  |
| `controls`     | Whether the player controls are enabled                                                                                                                           | Boolean |
| `currentTime`  | The current playback position in seconds of an ad or a video resource                                                                                                                          | Number  |
| `duration`     | The duration time of the video resource in seconds                                                                                                                | Number  |
| `ended`        | Whether the video has ended                                                                                                                                       | Boolean |
| `error`        | Contains error code, title and message about the last error that occurred in the player                                                                           | Object  |
| `fullscreen`   | Whether the player is in full-screen mode                                                                                                                         | Boolean |
| `muted`        | Whether the player is currently muted                                                                                                                             | Boolean |
| `paused`       | Whether the current playback state is paused                                                                                                                      | Boolean |
| `qualities`    | The video qualities that are available                                                                                                                            | Array   |
| `quality`      | The current quality value of the video element loaded                                                                                                             | String  |
| `seeking`      | Whether the video element is seeking                                                                                                                              | Boolean |
| `subtitle`     | The subtitle language code that is currently enabled                                                                                                              | String  |
| `subtitles`    | The available subtitle language codes of the media file                                                                                                           | Array   |
| `volume`       | The current volume level. Between 0.0 to 1.0. The volume and mute params operate separately, therefore, you could have a player with full volume, but also muted  | Number  |
| `video`        | Contains the video ID and title                                                                                                                                   | Object  |
| `companionAds` | An array of parsed companion ad creatives | Array   |
| `loop` | Whether the player is currently in loop mode | Boolean   |


```js
//Logging a video title to the console
console.log(player.video.title)
```

### Player Parameters {#player-parameters}

Use the below parameters to customize your player via the iframe or SDK embed.

| Parameter              | Info                                                                                                                                            | Type    |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `autoplay`             | Automatically attempt to start playback with sound, if it is blocked by the browser, the player will force the video mute                       | Boolean |
| `controls`             | Whether to display the player controls, true by default                                                                                         | Boolean |
| `id`                   | ID of the player unique to the page to be passed back with all API messages                                                                     | String  |
| `mute`                 | Whether to mute the video                                                                                                                       | Boolean |
| `quality`              | Specify the suggested playback quality for the video                                                                                            | Number  |
| `queue-autoplay-next`  | Whether to automatically play the next item in the queue                                                                                        | Boolean |
| `queue-enable`         | Whether to show the Up Next Queue                                                                                                               | Boolean |
| `sharing-enable`       | Whether to display the sharing button                                                                                                           | Boolean |
| `start`                | Specify the time (in seconds) from which the video should start playing                                                                         | Number  |
| `subtitles-default`    | Specify the default selected subtitles language                                                                                                 | String  |
| `syndication`          | Pass your syndication key to the player                                                                                                         | String  |
| `ui-highlight`         | Change the default highlight color used in the controls (hex value without the leading #). Color set in the Partner HQ will override this param | String  |
| `ui-logo`              | Whether to display the Dailymotion logo                                                                                                         | Boolean |
| `ui-start-screen-info` | Whether to show video information (title and owner) on the start screen                                                                         | Boolean |
| `playlist`             | Specify a playlist ID to populate the Up Next Queue with videos from a playlist                                                                 | String  |
| `fullscreen`             | Whether to display the fullscreen button                                                          | Boolean  |
| `scaleMode`             | Specify the default focus of the player in order to reframe and refocus on a specific area in the video. To be used for scaling and repurposing of videos between different aspect ratios for example landscape to portrait. Values ( ‘fit’, ‘fill’, ‘fillLeft’, ‘fillRight’, ‘fillTop’, ’fillBottom’ )                                                         | String  |
| `loop`             | Whether to loop a video or an entire playlist. A video embed will start over again automatically. A playlist embed will start to play from the first item in the playlist after the entire playlist has finished | Boolean  |
