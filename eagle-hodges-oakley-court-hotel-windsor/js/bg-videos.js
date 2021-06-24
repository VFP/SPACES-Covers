/**
 * FrBgVideos v1.0
 * Author: FROONT - froont.com
 */
window.FrBgVideos = (function (window, $, Froont) {
  'use strict';

  var self;

  function FrBgVideos() {
    self = this;
    self.init();
  }


  FrBgVideos.prototype = {
    _isInited: false,
    _prevDocumentWidth: null,
    _prevDocumentHeight: null,
    _items: [],

    stopped: true,
    youtubeJsApiReady: false,
    vimeoJsApiReady: false,


    /**
     * Initializes FrBgVideos, finds and registers elements with bg video
     */
    init: function () {
      if (window.Froont.isMobile) {
        return;
      }

      this._findAndRegisterEls();
    },


    /**
     * Destroys FrBgVideos by removing all listeners
     */
    destroy: function () {
      this._removeListeners();

      this._prevDocumentWidth = null;
      this._prevDocumentHeight = null;
    },


    /**
     * Starts FrBgVideos by adding listeners and updating all items
     */
    start: function () {
      this.stopped = false;
      this._addListeners();
      this._startAllItems();
    },


    /**
     * Stops FrBgVideos by removing listeners and cleaning each item
     */
    stop: function () {
      this.stopped = true;
      this._removeListeners();

      this._items.forEach(this._cleanItem, this);
    },


    /**
     * Registers element to corresponding FrBgVideo
     *
     * @param {Element} el       - document node to which bg video will be added to
     * @param {Object|String} options  - object of bg video provider and id or bg video url to parse data from
     */
    registerEl: function (el, bgVideoUrl) {
      if (window.isMobile) {
        return;
      }

      if (this._findItemById(el.id)) {
        return;
      }

      var options = this._getVideoProviderAndId(bgVideoUrl);

      if (!options) {
        console.log('No options for FrBgVideo', el.id, options);
        return;
      }

      var item = {
        el: el,
        provider: options.provider,
        videoId: options.videoId,
        videoContainerEl: null,
        videoEl: null,
        player: null,
        started: false
      };

      this._items.push(item);
    },


    /**
     * Un-registers element
     *
     * @param {Element} el - document node from which bg video will be removed from
     */
    unregisterEl: function (el) {
      var item = this._findItemById(el.id);

      if (!item) {
        return;
      }

      this._cleanItem(item);

      // Remove from items
      var index = this._items.indexOf(item);
      if (index > -1) {
        this._items.splice(index, 1);
      }
    },



    /**
     * Youtube player ready event handler
     *
     * @param  {Object} event - Youtube event
     */
    _onYoutubePlayerReady: function (event) {
      event.target.mute();
      self._updateItems();
    },


    /**
     * Vimeo player ready event handler
     *
     * @param  {String} id - Vimeo player id
     */
    _onVimeoPlayerReady: function (id) {
      $f(id).api('setVolume', 0);
      $f(id).api('setLoop', true);
      $f(id).api('play');
      self._updateItems();
    },


    /**
     * Resizes video to imitate background-size: cover
     * http://stackoverflow.com/questions/10797632/simulate-background-sizecover-on-video-or-img
     *
     * @param  {Object} item - FrBgVideo item object
     */
    _resizeToCover: function (item) {
      if (!item.videoContainerEl) {
        return;
      }

      item.videoEl = item.videoEl || item.videoContainerEl.querySelector('iframe');
      if (!item.videoEl) {
        return;
      }

      var videoOrigWidth = 640,
        videoOrigHeight = 360;

      var rect = item.videoContainerEl.getBoundingClientRect();

      // use largest scale factor - either horizontal or vertical
      var scaleH = rect.width / videoOrigWidth;
      var scaleV = rect.height / videoOrigHeight;
      var scale = Math.max(scaleH, scaleV);

      // scale and center the video within the viewport
      item.videoEl.style.width = scale * videoOrigWidth + 'px';
      item.videoEl.style.height = scale * videoOrigHeight + 'px';
    },


    /**
     * Returns video provider and video ID from given URL
     *
     * @param  {String} bgVideoUrl - Video URL
     * @return {Object}            - Video provider and URL
     */
    _getVideoProviderAndId: function (bgVideoUrl) {
      var provider = null,
        id = null;

      if (bgVideoUrl.indexOf('youtu') > -1) {
        provider = 'youtube';
        id = Froont.Helpers.getYouTubeIdFromURL(bgVideoUrl);
      } else if (bgVideoUrl.indexOf('vimeo') > -1) {
        provider = 'vimeo';
        id = Froont.Helpers.getVimeoIdFromURL(bgVideoUrl);
      }

      if (!(provider && id)) {
        return;
      }

      return {
        provider: provider,
        videoId: id
      };
    },


    /**
     * Updates each FrBgVideo initial values and items
     */
    _updateItems: function () {
      if (self.stopped) {
        return;
      }

      self._prevDocumentWidth = document.body.scrollWidth;
      self._prevDocumentHeight = document.body.scrollHeight;

      self._items.forEach(self._resizeToCover, self);
    },


    _startAllItems: function () {
      this._items.forEach(function (item) {
        if (item.started) {
          return;
        }

        item.videoContainerEl = item.videoContainerEl || $(item.el).find('.fr-bg-video-container').get(0);

        if (!item.videoContainerEl) {
          console.log('No video container for FrBgVideo el', item.el.id);
          return;
        }

        if (item.provider === 'youtube' && !item.videoContainerEl.children.length) {
          // YouTube iframe placeholder which will be replaced by YT.Player
          item.videoContainerEl.innerHTML = '<div id="youtube_player_' + item.el.id + '"></div>';
          self._loadYtPlayerApi();
        } else if (item.provider === 'vimeo' && !self.vimeoJsApiReady) {
          // Vimeo videos don't need placeholder since we add iframe ourselves
          self._loadVimeoPlayerApi();
        }

        if (item.provider === 'youtube') {
          // Wait for YouTube Iframe API to be ready
          if (!self.youtubeJsApiReady) {
            return;
          }

          item.player = new YT.Player('youtube_player_' + item.el.id, {
            width: 640,
            height: 360,
            videoId: item.videoId,
            playerVars: {
              playlist: item.videoId, // same as ID to make loop work
              controls: 0,
              autoplay: 1,
              loop: 1,
              modestbranding: 1,
              showinfo: 0,
              iv_load_policy: 3, // hide annotations
              enablejsapi: 1
            },
            events: {
              onReady: self._onYoutubePlayerReady
            }
          });
        } else if (item.provider === 'vimeo') {
          // Wait for Vimeo JS API to be ready
          if (!self.vimeoJsApiReady) {
            return;
          }

          var playerId = 'vimeo_player_' + item.el.id;

          item.videoContainerEl.innerHTML = '<iframe id="' + playerId + '" \
                        src="https://player.vimeo.com/video/' + item.videoId + '?title=0&byline=0&portrait=0&background=1&loop=1&mute=1&autoplay=1&api=1&player_id=' + playerId + '" \
                        width="640" height="360" frameborder="0"></iframe>';

          var iframe = document.getElementById(playerId);

          item.player = $f(iframe);
          item.player.addEvent('ready', self._onVimeoPlayerReady);
        }

        item.videoEl = item.videoEl || item.videoContainerEl.querySelector('iframe');
        item.started = true;
        this._resizeToCover(item);
      }, this);
    },


    /**
     * Looks up FrBgVideo item object by element ID
     *
     * @param  {String} id - ID by which array item will be looked up
     * @return {Object}    - FrBgVideo item object
     */
    _findItemById: function (id) {
      var foundItem;

      this._items.some(function (item) {
        var matches = (item.el.id === id);
        if (matches) {
          foundItem = item;
        }
        return matches;
      });

      return foundItem;
    },


    /**
     * Finds and registers all document nodes with FrBgVideo data attribute
     */
    _findAndRegisterEls: function () {
      $('[data-fr-bg-video-url]').each(function () {
        self.registerEl(this, $(this).data().frBgVideoUrl);
      });
    },


    /**
     * Adds event listeners
     */
    _addListeners: function () {
      this._debouncedOnResize = window.debounce ? window.debounce(this._onResize, 100, false) : this._onResize;
      window.addEventListener('resize', this._debouncedOnResize);
      this._onResize();
    },


    /**
     * Removed event listeners
     */
    _removeListeners: function () {
      if (this._debouncedOnResize) {
        window.removeEventListener('resize', this._debouncedOnResize);
      }
    },


    /**
     * Window resize event handler
     */
    _onResize: function () {
      self._updateItems();
    },


    /**
     * Removes wrapper elements and classes
     *
     * @param {Object} item - FrBgVideo item object
     */
    _cleanItem: function (item) {
      item.videoContainerEl.innerHTML = '';
      item.player = null;
      item.videoEl = null;

      item.started = false;
    },


    /**
     * Loads YouTube iframe API if not loaded already
     * https://developers.google.com/youtube/iframe_api_reference
     */
    _loadYtPlayerApi: function () {
      Froont.External.loadYouTubeAPI(function () {
        if (!self.stopped) {
          self.youtubeJsApiReady = true;
          self._startAllItems();
        }
      });
    },


    /**
     * Loads Vimeo JavaScript API if not loaded already
     * https://developer.vimeo.com/player/js-api
     */
    _loadVimeoPlayerApi: function () {
      Froont.External.loadVimeoAPI(function () {
        if (!self.stopped) {
          self.vimeoJsApiReady = true;
          self._startAllItems();
        }
      });
    }
  };

  return FrBgVideos;

})(window, jQuery, window.Froont);
