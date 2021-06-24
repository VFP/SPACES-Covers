window.Froont = window.Froont || {};

/* Here go external API loaders: */
window.Froont.External = (function (window) {
  'use strict';

  return {
    /**
     * Loads YouTube iframe API if not loaded already
     * https://developers.google.com/youtube/iframe_api_reference
     */
    loadYouTubeAPI: (function () {
      var ytAPILoaded = false,
        ytAPILoading = false,
        waitingCallbackStack = [];

      window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
        ytAPILoaded = true;

        while (waitingCallbackStack.length) {
          var callback = waitingCallbackStack.pop();
          callback();
        }
      };

      function loadYTAPI() {
        var tag = document.createElement('script'),
          firstScriptTag = document.getElementsByTagName('script')[0];

        ytAPILoading = true;
        tag.src = 'https://www.youtube.com/iframe_api';
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      };

      return function (callback) {
        if (!(ytAPILoading || ytAPILoaded)) {
          loadYTAPI();
        }
        if (ytAPILoaded) {
          callback();
        } else {
          waitingCallbackStack.push(callback);
        }
      };
    })(),

    /**
     * Loads Vimeo JavaScript API if not loaded already
     * https://developer.vimeo.com/player/js-api
     */
    loadVimeoAPI: (function () {
      var vimeoAPILoaded = false,
        vimeoAPILoading = false,
        waitingCallbackStack = [];

      window.onVimeoJsAPIReady = function onVimeoJsAPIReady() {
        vimeoAPILoaded = true;

        while (waitingCallbackStack.length) {
          var callback = waitingCallbackStack.pop();
          callback();
        }
      };

      function loadVimeoAPI() {
        var tag = document.createElement('script'),
          firstScriptTag = document.getElementsByTagName('script')[0];
        vimeoAPILoading = true;

        tag.onload = window.onVimeoJsAPIReady;
        tag.src = 'https://f.vimeocdn.com/js/froogaloop2.min.js';
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      return function (callback) {
        if (!(vimeoAPILoaded || vimeoAPILoading)) {
          loadVimeoAPI();
        }
        if (vimeoAPILoaded) {
          callback();
        } else {
          waitingCallbackStack.push(callback);
        }
      };
    })()
  };
})(window);
