window.FRPopup = (function (window, $) {
  'use strict';
  var self;

  /* Triggers `fr-popup-open`, `fr-popup-close` */

  function FRPopup(config) {
    self = this;
    self.config = $.extend(self.defaults, config);
    self.popup = $.magnificPopup.instance;
    self.closingFromURL = false; // When popup is being closed as a side effect of navigation
    self.isOpen = false;
    self.afterCloseCallback = null;
    self.locationParts = [];
    self.switchingPopups = false;
    self.documentScrollTop = 0;  // Scroll position of document when popup gets opened
    self.documentScrollLeft = 0;  // Scroll position of document when popup gets opened

    self.init();
  }


  FRPopup.prototype = {

    defaults: {
      selector: '.fr-popup-anchor',
      closeSelector: '.fr-popup-close'
    },


    init: function () {
      // Clear previous events if any
      if (self.$popupEls) {
        self.$popupEls.off('click', self._onPopupElClick);
      }
      if (self.$popupCloseEls) {
        self.$popupCloseEls.off('click', self._onPopupCloseElClick);
      }

      self.$popupEls = $(self.config.selector);
      self.$popupCloseEls = $(self.config.closeSelector);
      self._attachPopup();

     /** Because 'popstate' isn't triggered until all the assets are loaded and that may disable the popup navigation for quite some time */
      window.addEventListener('hashchange', self._showPopupFromURL);
      self._showPopupFromURL();
    },


    destroy: function () {
      self.$popupEls.off('click', self._onPopupElClick);
      self.$popupCloseEls.off('click', self._onPopupCloseElClick);
      self.popup.close();
    },

    /**
     * Close popup, scroll to given element and set location hash to it's id
     *
     * @param {HTMLElement} el
     */
    navigateToEl: function (el) {
      var elInThisPopup = self.popup.content[0].querySelector('#' + el.id);

      if (elInThisPopup) {
        /* Navigate in this popup */
        self.popup.wrap.animate({
          scrollTop: $(el).offset().top
        }, 500);

        return;
      }

      self.afterCloseCallback = function () {
        self.afterCloseCallback = null;

        requestAnimationFrame(function() {
          $('html,body').animate({
            scrollTop: $(el).offset().top
          }, 500, function () {
            self._pushUrl('#' + el.id);
            $(el).focus();
          });
        });
      };

      self.closingFromURL = true;
      return self.popup.close();
    },


    _attachPopup: function () {
      self.$popupEls.on('click', self._onPopupElClick);
      self.$popupCloseEls.on('click', self._onPopupCloseElClick);
    },


    _recalculateSwiperSlideshow: function ($el) {
      var slideshows = $el.find('.swiper-container');

      if ($el.get(0).classList.contains('swiper-container')) {
        slideshows = slideshows.addBack($el);
      }

      slideshows.each(function() {
        var swiper = window.swiperSlideshows && window.swiperSlideshows[this.id];
        if (swiper) {
          swiper.update(true);
        }
      });
    },


    _onPopupElClick: function (event) {
      event.preventDefault();
      var targetLocation = event.currentTarget.getAttribute('href');
      targetLocation = targetLocation ? targetLocation.substr(1) : 0;


      /* Prevent propagation to prevent clicking on overlay when popup gets closed while switching popups */
      if ($(event.target).closest('.mfp-content').length > 0) {
        /*
        Preventing propagation here should not bother the application because,
        the existing popup will be closed. And there will be no where to bubble up to except overlay.
        */
        event.stopPropagation();
      }
      if (self.isOpen) {
        self.afterCloseCallback = function() {
          self.afterCloseCallback = null;
          self.switchingPopups = false;
          self.locationParts = [self.locationParts[0], event.currentTarget.id, targetLocation];
          self._showPopup(event.currentTarget);
        };
        self.switchingPopups = true;
        /*
        - Close the old popup so the configuration would be updated in the new one.
        - Opening new popup when one is already opened doesn't update the configuration
        */
        self.popup.close();
      } else {
        self.locationParts = [event.currentTarget.id, targetLocation];
        self._showPopup(event.currentTarget);
      }
    },


    /**
     * Show target popup of given element.
     *
     * @param {HTMLElement} el - anchor from which we find the popup element
     * @param {number} [index] - Index of gallery image in a popup if popup is gallery
     * @param {string} [anchor] - anchor of popup element if we're showing popup from URL
     */
    _showPopup: function (el, index) {
      var href = el.getAttribute('href'),
          isDisplayingImage = false,
          isGallery = false,
          $target = $('#' + self.locationParts[self.locationParts.length - 1]),
          galleryTarget = null,
          $prependToEl = null,
          items,
          popupAlign = el.getAttribute('data-fr-popup-align');

      self.showThumbs = false;
      self.closingFromURL = false;

      // Check if popup href target is gallery
      if ($target.length && $target.get(0).classList.contains('fr-popup-gallery')) {
        galleryTarget = $target.get(0);
      }

      // If target is gallery widget then show images popup
      if (galleryTarget || el.classList.contains('fr-popup-gallery')) {
        galleryTarget = galleryTarget || el;
        isGallery = true;
        items = [];

        if (galleryTarget.hasAttribute('data-gallery-show-thumbs')) {
          self.showThumbs = true;
        }

        try {
          items = JSON.parse(galleryTarget.dataset.galleryImages);
          items = items.map(function (item) {
            return {
              type: 'image',
              src: item.src,
              title: item.title
            };
          });
        }
        catch (e) {
          return;
        }
      }

      else if (href) {
        if (!$target.length) { return; }

        items = {type: 'inline', src: $target};

        // If target is image widget then show image popup
        if ($target.hasClass('fr-img')) {
          var img = $target.find('img').first();

          if (img) {
            isDisplayingImage = true;
            items = {
              type: 'image',
              src: img.attr('src'),
              title: img.attr('title')
            };
          }
        }

        // If target widget is container and has no children find background image and show it in popup
        else if ($target.hasClass('fr-container')) {
          var childWidgets = $target.find('.fr-widget');

          if (!childWidgets.length) {
            var backgroundImage = $target.css('background-image').match(/url\(['"]?([^'"]+)['"]?\)/);

            if (backgroundImage) {
              isDisplayingImage = true;
              items = {type: 'image', src: backgroundImage[1]};
            }
          }
        }
      }

      if (!items || isGallery && !items.length) { return; }

      var froontContent = $target.closest('.b-content');
      if (froontContent.length) {
        $prependToEl = froontContent.first();
      }

      var mainClasses = [];

      if (self.showThumbs) {
        mainClasses.push('mfp-gallery-with-thumbs');
      }

      if (popupAlign) {
        mainClasses.push('mfp-align-' + popupAlign);
      }

      self.popup.open({
        prependTo: $prependToEl,
        items: items,
        removalDelay: 300,
        mainClass: mainClasses.join(' '),
        showCloseBtn: !el.classList.contains('fr-popup-close-button-hide'),
        index: index,
        autoFocusLast: false,
        fixedContentPos: true,

        gallery: {
          enabled: isGallery
        },

        callbacks: {
          beforeOpen: function () {
            self.documentScrollTop = window.Froont.Helpers.getPageScrollTop();
            self.documentScrollLeft = window.Froont.Helpers.getPageScrollLeft();
            document.body.classList.add('fr-mfp-open');

            window.requestAnimationFrame(function () {
              window.Froont.Helpers.setPageScrollTop(self.documentScrollTop);
              window.Froont.Helpers.setPageScrollLeft(self.documentScrollLeft);
            });

            self._attachThumbnails();
          },

          open: function () {
            self.isOpen = true;
            self._triggerOpen();

            // First "afterChange" event happens before popup is visible, so we do this on "open".
            if (this.content.length) {
              // Recalculate Swiper slideshows when open in popup
              // Slideshow must be visible for this to work
              self._recalculateSwiperSlideshow(this.content);
            }
          },

          change: function (item) {
            if (!isDisplayingImage && !isGallery) {
              this.content.css('display', 'block');
            }
            self._setActiveThumb(item.index);

            if (!self.openingFromURL) {
              var urlPart = isGallery ? item.index + 1 : self.locationParts[self.locationParts.length - 1];
              if (isGallery && self.isOpen) {
                self._replaceUrl('#' + self.locationParts.slice(0, -1).join('/') + '/' + urlPart);
              } else {
                self._pushUrl('#' + self.locationParts.slice(0, -1).join('/') + '/' + urlPart);
              }
            }
            // Set to false until next _showPopup call
            self.openingFromURL = false;
          },

          /**
           * Called after content has been set after change event
           *
           * This is an un-documented event, but it's the only thing that happens
           * after change when the content is visible. So will relay on it.
           */
          afterChange: function() {
            if (self.isOpen && this.content.length) {
              // Recalculate Swiper slideshows when open in popup
              // Slideshow must be visible for this to work
              self._recalculateSwiperSlideshow(this.content);
            }
          },

          beforeClose: function () {
            // before close
          },

          afterClose: function () {
            document.body.classList.remove('fr-mfp-open');
            requestAnimationFrame(function() {
              // Fix the body scroll position where it was
              /* Apply the scroll position in the next stack */
              window.Froont.Helpers.setPageScrollTop(self.documentScrollTop);
              window.Froont.Helpers.setPageScrollLeft(self.documentScrollLeft);

              // `autoFocusLast` by default is false
              // focus manually to last active element unless hash first part is different
              var hashFirstPart = document.location.hash.replace('#', '').split('/')[0];

              if (self.popup._lastFocusedEl && self.locationParts[0] === hashFirstPart) {
                self.popup._lastFocusedEl.focus();
              }

              if ($target.length) {
                $target.removeClass('mfp-hide').css('display', '');

                // Recalculate Swiper slideshows when returned to DOM
                self._recalculateSwiperSlideshow($target);
              }

              if (!self.closingFromURL && !self.switchingPopups) {
                self._pushUrl('#' + self.locationParts[0]);
              }
              if (!self.switchingPopups) {
                self.locationParts = [];
              }
              self.closingFromURL = false;
              self.isOpen = false;
              self._triggerClose();

              if (self.afterCloseCallback instanceof Function) {
                self.afterCloseCallback();
              }
            });
          }
        }
      });
    },


    /**
     * Opens popup as a result of navigation.
     *
     * @note: neither `popstate` nor `hashchange` is triggered after using `history.pushState(...);`
     */
    _showPopupFromURL: function () {
      var hash, fragments, $el, el, index;

      hash = document.location.hash;
      fragments = hash && decodeURI(hash).split(/\//g);

      if (!fragments || fragments.length < 2) {
        if (self.isOpen) {
          return self._closePopupFromURL();
        }
        return;
      }

      self.locationParts = [fragments[0].replace('#', '')].concat(fragments.slice(1));

      // Find popup anchor element (we need settings from it):
      if (fragments[0].indexOf('#') === 0) {
        try {
          /* Anchor is normally visible, popup isn't */
          $el = $(fragments[0] + ':visible');
        }
        catch (e) {
          console.error('Could not find popup target el');
        }

        if ($el && $el.length) {
          el = $el.get(0);
        }
        else {
          return self._closePopupFromURL();
        }
      }


      if (fragments.length === 3) {
        el = $('#' + fragments[1]).get(0);
      }

      self.openingFromURL = true;

      // Get gallery index
      if (!isNaN(fragments[fragments.length - 1])) {
        index = parseInt(fragments[fragments.length - 1]) - 1;
      }

      if (self.isOpen) {
        self.afterCloseCallback = function() {
          self.afterCloseCallback = null;
          self.switchingPopups = false;
          self._showPopup(el, index);
        };
        self.switchingPopups = true;
        self.popup.close();
      } else {
        self._showPopup(el, index);
      }
    },


    _onPopupCloseElClick: function (e) {
      e.preventDefault();
      self.popup.close();
    },


    _closePopupFromURL: function () {
      self.closingFromURL = true;
      return self.popup.close();
    },


    _attachThumbnails: function() {
      if (!self.showThumbs) {
        return;
      }

      var mp = $.magnificPopup.instance;

      var html = '<div class="mfp-thumbs-wrap"> <ul class="mfp-thumbs mfp-prevent-close" data-thumbs-count="' + mp.items.length + '"">';

      mp.items.forEach(function (item, index) {
        html += '<li onclick="javascript:$.magnificPopup.instance.goTo(' + index + ');return false;"';
        html += ' style="background-image: url(' + item.src + ')" class="mfp-prevent-close';
        if (item.index === mp.index) {
          html += ' active';
        }
        html += '" data-index="' + index + '"> </li>';
      });
      html += '</ul> </div>';

      mp.$thumbs = $(html);
      mp.container.append(mp.$thumbs);
    },


    _setActiveThumb: function (index) {
      if (!self.showThumbs) {
        return;
      }

      var mp = $.magnificPopup.instance;

      mp.$thumbs.find('li').removeClass('active');
      mp.$thumbs.find('[data-index="' + index + '"]').addClass('active');
    },


    _pushUrl: function (url) {
      if (history && history.pushState) {
        history.pushState(null, null, url);
      }
    },

    _replaceUrl: function (url) {
      if (history && history.replaceState) {
        history.replaceState(null, null, url);
      }
    },

    _triggerOpen: function () {
      var event;
      if (typeof (Event) === 'function') {
        event = new Event('fr-popup-open');
      } else {
        event = document.createEvent('Event');
        event.initEvent('fr-popup-open', true, true);
      }
      window.dispatchEvent(event);
    },

    _triggerClose: function () {
      var event;
      if (typeof (Event) === 'function') {
        event = new Event('fr-popup-close');
      } else {
        event = document.createEvent('Event');
        event.initEvent('fr-popup-close', true, true);
      }
      window.dispatchEvent(event);
    }
  };

  return FRPopup;

})(window, window.jQuery);
