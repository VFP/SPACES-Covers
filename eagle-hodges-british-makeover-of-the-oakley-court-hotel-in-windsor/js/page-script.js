// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

window.Froont = window.Froont || {};
window.Froont.jQuery = window.jQuery;
window.Froont.options = {};


jQuery(function ($) {
  'use strict';

  if (window.Froont.isMobile) {
    $('.b-content').addClass('is-mobile');
  }

  // Creates widget animations
  if (window.RevealAnimation) {
    window.revealAnimation = new RevealAnimation();
  }

  // Creates widget scroll effects
  if (window.FRScrollEffects) {
    window.frScrollEffects = new window.FRScrollEffects();
    window.frScrollEffects.start();
  }

  // Creates widgets background videos
  if (window.FrBgVideos) {
    window.frBgVideos = new window.FrBgVideos();
    window.frBgVideos.start();
  }

  // Creates background parallax
  if (window.BackgroundParallax) {
    window.backgroundParallax = new BackgroundParallax();
  }

  // Creates slideshows
  var $slideshows = $('.swiper-container[data-swiper-enabled]');

  window.swiperSlideshows = {};
  window.Froont.swiperSlideshows = window.swiperSlideshows;

  window.Froont.initSlideshow = function (el) {

    var $slideshow = $(el),
      $slideWraper = $slideshow.children('.swiper-wrapper'),
      $slides = $slideWraper.children('.fr-widget.fr-container');

    if ($slides.length && $slideWraper.length === 1) {
      $slides.addClass('swiper-slide');

      var swiperOptions = {
        direction: 'horizontal',
        speed: 1000,
        on: {
          init: function () {
            window.addEventListener('fr-animations-ready', function () {
              window.revealAnimation.animateSlide(this);
            }.bind(this));
          },
          slideChangeTransitionStart: function () {
            if (window.revealAnimation) {
              setTimeout(function () {
                window.revealAnimation.animateSlide(this);
                window.revealAnimation.resetSlideAnimations(this);
              }.bind(this), swiperOptions.speed/2);
            }
          }
        }
      };

      // Set autoHeight
      var autoHeight = $slideshow.data('slideshowAutoheight');
      if (typeof autoHeight !== 'undefined' && autoHeight !== 'false') {
        swiperOptions.autoHeight = true;
      }

      // Set mouse wheel control
      var mousewheelControl = $slideshow.data('slideshowMousewheelControl');
      if (typeof mousewheelControl !== 'undefined' && mousewheelControl !== 'false') {
        swiperOptions.mousewheel = {
          releaseOnEdges: true
        };
        swiperOptions.preventInteractionOnTransition = true;
      }

      var loopDisabled = $slideshow.data('slideshowLoopDisabled');
      loopDisabled = !(typeof loopDisabled === 'undefined' || loopDisabled === 'false');
      if (!loopDisabled) {
        swiperOptions.loop = true;
      }

      var touchMoveDisabled = $slideshow.data('slideshowTouchMoveDisabled');
      if (typeof touchMoveDisabled !== 'undefined' && touchMoveDisabled !== 'false') {
        swiperOptions.allowTouchMove = false;
      }

      // Set autoplay interval if enabled
      var autoplay = $slideshow.data('slideshowAutoplay');
      if (autoplay) {
        swiperOptions.autoplay = {
          delay: autoplay,
          stopOnLastSlide: !!loopDisabled
        };
      }

      // Set the pagination container if enabled
      var pagination = $slideshow.data('slideshowPagination');
      if (typeof pagination !== 'undefined' && pagination !== 'false') {
        swiperOptions.pagination = {
          el: $slideshow.children('.swiper-pagination')[0],
          clickable: true
        };
      }

      // Set slideshow direction
      var direction = $slideshow.data('slideshowDirection');
      if (direction) {
        swiperOptions.direction = direction;
      }

      // Set slideshow effect
      var effect = $slideshow.data('slideshowEffect');
      if (effect) {
        swiperOptions.effect = effect;
      }

      // Generate the Swiper
      var swiper = new Swiper(el, swiperOptions);

      // Cache Swiper objects to be able to update them when needed
      // @TODO swiperSlideshows are cached in namespaced window.Froont object,
      // remove it from window object and update the code where it's used
      window.swiperSlideshows[el.id] = swiper;

      window.Froont.swiperSlideshows[el.id] = swiper;

      // Add arrow button functionality to Swiper
      var $arrows = $slideWraper.children('.fr-widget.fr-img, .fr-widget.fr-svg'),
        $arrowLeft = $arrows.eq(0),
        $arrowRight = $arrows.eq(1);

      // Move arrows outside the .swiper-wrapper
      $slideshow.append($arrows);

      if ($arrowLeft.length) {
        $arrowLeft.on('click', function () {
          swiper.slidePrev();
        });
      }

      if ($arrowRight.length) {
        $arrowRight.on('click', function () {
          swiper.slideNext();
        });
      }
    }
  };

  $slideshows.each(function () {
    this.addEventListener('scroll', function () {
      // A fix for slideshow content being shifted after navigation
      if (this.scrollTop !== 0) {
        this.scrollTop = 0;
      }
      if (this.scrollLeft !== 0) {
        this.scrollLeft = 0;
      }
    });
    window.Froont.initSlideshow(this);
  });

  var onHashChange = function () {
    if (document.location.hash && document.location.hash.indexOf('/') === -1 && !window.Froont.options.hashChangeByClick) {
      // If navigating to an element in a slideshow, switch to it's container slide:
      var containerSlide = window.Froont.Helpers.getElementParentSlide(document.querySelector(document.location.hash));
      if (!containerSlide) {
        return;
      }
      try {
        window.Froont.Helpers.switchToContainerSlide(containerSlide, window.Froont.swiperSlideshows, null, 0);
        $('html,body').scrollTop($(containerSlide).closest('.swiper-container').offset().top);
      } catch (e) {}
    }
    window.Froont.options.hashChangeByClick = false;
  };

  /** @todo: Centralize all navigation event handling */
  window.onhashchange = onHashChange;
  onHashChange();

  // Creates popup
  if (window.FRPopup) {
    window.frPopup = new FRPopup({
      prependTo: document.querySelector('.b-content')
    });
  }

  // Used for navigation widget
  if (window.responsiveNav && $('.fr-navigation-active').length) {
    $('.fr-navigation').each(function () {
      var $navHeader = $(this);
      var $nav = $navHeader.children('.fr-container');
      var $navToggle = $navHeader.children('.fr-navigation-toggle');
      // Backwards compatibility
      if (!$navToggle.length) {
        $navToggle = $navHeader.children('.fr-svg');
      }

      window.navigation = window.responsiveNav($nav.attr('id'), {
        customToggle: $navToggle.attr('id'),
        closeOnNavClick: true,
        jsClass: 'x-nav-js',
        navClass: 'x-nav-collapse',
        navActiveClass: 'x-js-nav-active',
        includeMargins: true
      });
    });
  }

  // Anchor navigation smooth scrolling
  $('a:not(.fr-popup-anchor)').on('click', function (event) {
    window.Froont.options.hashChangeByClick = true;
    var href = this.href;

    if (!href || href.indexOf('#') === -1) {
      return;
    }

    var baseUrl = document.location.href.replace(document.location.hash || '#', '');
    var isSameDocument = href.replace(baseUrl, '').indexOf('#') === 0;

    if (!isSameDocument) {
      return;
    }

    var hash = this.hash;
    if (hash.indexOf('/') > -1) {
      return;
    }

    var $element = $(hash);
    if (!$element.length) {
      return;
    }

    // Don't navigate, will set the location hash on our own
    event.preventDefault();

    var parentSlide = window.Froont.Helpers.getElementParentSlide($element[0]);

    if (parentSlide) {
      // If the target element is in a slide-show, navigate to it's container slide
      window.Froont.Helpers.switchToContainerSlide(parentSlide, window.Froont.swiperSlideshows);
      $('html,body').animate({
        scrollTop: $(parentSlide).closest('.swiper-container').offset().top
      }, 500, function () {
        window.location.hash = hash;
      });
      return;
    } else if (window.frPopup.isOpen) {
      window.frPopup.navigateToEl($element[0]);
      return;
    }

    $('html,body').animate({
      scrollTop: $element.offset().top
    }, 500, function () {
      window.location.hash = hash;
    });
    return false;
  });

  // History back navigation
  $('.fr-history-back').on('click', function (e) {
    e.preventDefault();
    window.history.back();
  });

  // Creates grid galleries
  if (window.Froont.FrGridGallery) {
    var $gridGalleries = $('.fr-grid-gallery');
    var options = {
      prependTo: document.querySelector('.b-content')
    };

    $gridGalleries.each(function (i, gallery) {
      new window.Froont.FrGridGallery(gallery, options);
    });
  }

  // Play/Pause video on click:
  var videoElements = $('.fr-video video');
  if (videoElements.length) {
    videoElements.on('click', function (e) {
      if (e.target.paused) {
        e.target.play();
      } else {
        e.target.pause();
      }
    });
  }
});
