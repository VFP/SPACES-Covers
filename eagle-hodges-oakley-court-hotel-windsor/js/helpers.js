/**
 * Universal helpers used through Froont frontend
 * These should be pure functions that don't depend on other Froont peaces
 */
window.Froont.Helpers = (function (window, $) {
  'use strict';

  /**
   * Gets video ID from given URL and prefixes
   * http://stackoverflow.com/questions/5612602/improving-regex-for-parsing-youtube-vimeo-urls
   *
   * @param  {String} str        - Video URL
   * @param  {String[]} prefixes - Video ID prefixes to look for
   * @return {String}            - Vide ID or undefined
   */
  function _getVideoId(str, prefixes) {
    var cleaned = str.replace(/^(https?:)?\/\/(www\.)?/, '');
    for (var i = 0; i < prefixes.length; i++) {
      if (cleaned.indexOf(prefixes[i]) === 0) {
        return cleaned.substr(prefixes[i].length);
      }
    }
    return undefined;
  }

  return {

    /**
     * Gets YouTube ID from given URL
     *
     * @param  {String} url - Video URL
     * @return {String}     - Video ID or undefined
     */
    getYouTubeIdFromURL: function (url) {
      return _getVideoId(url, [
        'youtube.com/watch?v=',
        'youtu.be/',
        'youtube.com/embed/'
      ]);
    },

    /**
     * Gets Vimeo ID from given URL
     *
     * @param  {String} url - Video URL
     * @return {String}     - Video ID or undefined
     */
    getVimeoIdFromURL: function (url) {
      return _getVideoId(url, [
        'vimeo.com/',
        'player.vimeo.com/video/'
      ]);
    },

    getElementParentSlide: function(element) {
      var $parentSlide = $(element).closest('.swiper-slide');
      return !!$parentSlide[0] ? $parentSlide : null;
    },

    /**
     * If given element is contained in a slideshow slide, switch to the slide
     * @param {HTMLElement} element - Element we wish to focus on
     * @param {{[k: string]: Object}} slideshowMap - object, where slideshow elements are mapped to their element IDs
     * @param {Function} callback - a function that's called after slide switch has taken place
     * @param {Number} speed - The duration of slide transition animation in ms
     *
     * @returns {boolean} - was any slideshow switched or no
     */
    switchToContainerSlide: function (element, slideshowMap, callback, speed) {
      var $parentSlide = window.Froont.Helpers.getElementParentSlide(element);
      if (!$parentSlide) {
        return false;
      }

      var parentSlideshow  = $parentSlide.closest('.swiper-container')[0];
      if (!parentSlideshow) {
        return false;
      }
      var swiperInstance = slideshowMap[parentSlideshow.id];

      if (callback && swiperInstance.params.direction === 'vertical') {
        swiperInstance.once('slideChangeTransitionEnd', callback);
      }

      var slideIndex = $parentSlide.data('swiperSlideIndex');
      if (slideIndex || slideIndex === 0) {
        swiperInstance.slideToLoop($parentSlide.data('swiperSlideIndex'), speed);
        return true;
      }

      slideIndex = $parentSlide.parent().children().index($parentSlide[0]);
      swiperInstance.slideTo(slideIndex, speed);

      if (callback && swiperInstance.params.direction !== 'vertical') {
        callback();
      }
      return true;
    },

    getPageScrollTop: function() {
      return $('html,body').scrollTop();
    },

    setPageScrollTop: function(scrollTop) {
      $('html,body').scrollTop(scrollTop);
    },

    getPageScrollLeft: function() {
      return $('html,body').scrollLeft();
    },

    setPageScrollLeft: function(scrollTop) {
      $('html,body').scrollLeft(scrollTop);
    },

    // Debounce function
    // http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
    debounce: function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
        var obj = this,
          args = arguments;

        function delayed() {
          if (!execAsap)
            func.apply(obj, args);
          timeout = null;
        };

        if (timeout)
          clearTimeout(timeout);
        else if (execAsap)
          func.apply(obj, args);

        timeout = setTimeout(delayed, threshold || 100);
      };
    },

    /**
     * Check if element is in opened popup
     *
     * @param {HTMLElement} el
     */
    isInPopup: function (el) {
      if (el.parentElement.classList.contains('mfp-content')) {
        return true;
      }

      if (el.parentElement.tagName.toUpperCase() === 'BODY') {
        return false;
      }

      return Froont.Helpers.isInPopup(el.parentElement);
    }
  };
})(window, window.jQuery);
