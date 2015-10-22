/*
 * Based on Paraxify.js v0.1 library by Jaime Caballero, MIT license (https://github.com/jaicab/Paraxify.js)
 */

window.BackgroundParallax = (function (window, $) {
    'use strict';
    var self;

    /***
     * BackgroundParallax object
     *
     */
    function BackgroundParallax(config) {
        self = this;
        self.config = $.extend(self.defaults, config);

        self.$parallaxEls = null;
        self.screenHeight = 0;
        self.scrollY = 0;
        self.parallaxElsData = null;

        self.init();
    }


    BackgroundParallax.prototype = {

        defaults: {
            mobile: true,
            selector: '.fr-background-parallax-active',
            speed: 1,
            boost: 0
        },


        init: function () {
            if (window.isMobile && !self.config.mobile) {
                self.destroy();
                return;
            }

            self.$parallaxEls = $(self.config.selector);

            if (!self.$parallaxEls.length) {
                return;
            }

            self.parallaxElsData = [];

            $(window).on('resize', self._updateParallax);
            $(window).on('scroll', self._updateBackgroundPosition);

            self._updateParallax();
        },


        destroy: function () {
            $(window).off('resize', self._updateParallax);
            $(window).off('scroll', self._updateBackgroundPosition);

            if (self.$parallaxEls) {
                self.$parallaxEls.each(function () {
                    $(this).removeAttr('style');
                });

                self.$parallaxEls = null;
            }

            self.parallaxElsData = null;
        },


        _updateParallax: function () {
            self.screenHeight = window.innerHeight;
            self.scrollY = window.pageYOffset;

            self.$parallaxEls.each(function (i) {
                var $el = $(this);
                self.parallaxElsData[i] = {};

                $el.css('background-position', 'center center');

                var bgImg = $el.css('background-image');
                var bgImgUrl = bgImg.match(/url\((['"])?(.*?)\1\)/i);
                if (bgImgUrl) {
                    bgImgUrl = bgImgUrl[2];
                }

                self.parallaxElsData[i].hasOverlayColor = bgImg.indexOf('linear-gradient(') !== -1;
                self.parallaxElsData[i].url = bgImgUrl;
                self.parallaxElsData[i].img = self.parallaxElsData[i].img || new Image();

                self._readBackgroundImageDimensions(i);
                if (bgImgUrl !== self.parallaxElsData[i].img.src) {
                    self.parallaxElsData[i].img.src = bgImgUrl;
                }

            });

            self._updateBackgroundPosition();
        },


        _readBackgroundImageDimensions: function (i) {
            var $el = $(self.$parallaxEls[i]);

            self.parallaxElsData[i].ok = true;
            self.parallaxElsData[i].bgSize = $el.css('background-size');

            var actualHeight = self.screenHeight;
            var speedAttr = $el.attr('data-fr-background-parallax-speed');

            // Speed in data attribute is saved in range -100 to +100
            // meaning when less than 0 background is moving slower than scroll
            // and when more than 0 background is moving faster than scroll.
            // Here we convert it to range 0 to 2.
            if (speedAttr) {
                if (speedAttr > 0) {
                    speedAttr = speedAttr / 100 + 1;
                }
                else if (speedAttr < 0) {
                    speedAttr = speedAttr / -100;
                }
            }
            var speed = speedAttr || self.config.speed;

            // set parallax speed to same value as speed to get more expressive parralax effect
            var boost = speed;

            self.parallaxElsData[i].img.onload = self.parallaxElsData[i].img.onload || function () {
                if (!self.parallaxElsData[i].img.complete) {
                    return;
                }

                if (self.screenHeight < $el.outerHeight()) {
                    self.parallaxElsData[i].ok = false;
                    console.warn("The container (" + $el.outerHeight() + "px) can't be bigger than the image (" + self.screenHeight + "px).");
                }

                self.parallaxElsData[i].onloadFired = true;

                self._updateParallaxElDiff(i, $el, actualHeight, speed, boost);
                self._updateBackgroundPositionOf(i);
            };

            // HTMLImageElement.complete
            // Returns a Boolean that is true if the browser has fetched the image,
            // and it is in a supported image type that was decoded without errors.
            if (self.parallaxElsData[i].img.complete) {
                if (self.parallaxElsData[i].onloadFired) {
                    self._updateParallaxElDiff(i, $el, actualHeight, speed, boost);
                }
                else {
                    self.parallaxElsData[i].img.onload();
                }
            }
        },


        _updateParallaxElDiff: function (i, $el, actualHeight, speed, boost) {
            var diff = -(actualHeight - $el.outerHeight()) * speed;
            diff -= ($el.outerHeight() * boost);

            self.parallaxElsData[i].diff = diff;
        },


        _isElementInViewport: function (i) {
            var el = self.$parallaxEls[i];
            var rect = el.getBoundingClientRect();

            return (
                // top edge is inside viewport
            (rect.top >= 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight)) ||
                // bottom edge is inside viewport
            (rect.bottom > 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) ||
                // both top and bottom edges are outside viewport (element higher than viewport)
            (rect.top <= 0 && rect.bottom >= (window.innerHeight || document.documentElement.clientHeight))
            );
        },


        _updateBackgroundPosition: function () {
            self.scrollY = window.pageYOffset;

            self.$parallaxEls.each(function (i) {
                self._updateBackgroundPositionOf(i);
            });
        },


        _updateBackgroundPositionOf: function(i) {
            var per, position;

            var $el = $(self.$parallaxEls[i]);
            if (self.parallaxElsData[i].ok && self._isElementInViewport(i)) {
                per = (self.scrollY - $el.offset().top + self.screenHeight) / ($el.outerHeight() + self.screenHeight);
                position = self.parallaxElsData[i].diff * (per - 0.5);
                position = (Math.round(position * 100) / 100) + 'px';
            }
            else {
                position = 'center';
            }

            // update css if position has changed
            if (self.parallaxElsData[i].position !== position) {
                self.parallaxElsData[i].position = position;
                // Overlay color (linear-gradient) is element size therefore shouldn't be moved
                if (self.parallaxElsData[i].hasOverlayColor) {
                    $el.css('background-position', '0 0, center ' + position);
                }
                else {
                    $el.css('background-position', 'center ' + position);
                }
            }
        },


        _injectElementWithStyles: function (rule, callback, nodes, testnames) {

            var style, ret, node, docOverflow,
                div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body'),
                mod = 'modernizr';

            if (parseInt(nodes, 10)) {
                while (nodes--) {
                    node = document.createElement('div');
                    node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                    div.appendChild(node);
                }
            }

            style = ['&#173;', '<style id="s', mod, '">', rule, '</style>'].join('');
            div.id = mod;
            (body ? div : fakeBody).innerHTML += style;
            fakeBody.appendChild(div);
            if (!body) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
                docOverflow = docElement.style.overflow;
                docElement.style.overflow = 'hidden';
                docElement.appendChild(fakeBody);
            }

            ret = callback(div, rule);
            if (!body) {
                fakeBody.parentNode.removeChild(fakeBody);
                docElement.style.overflow = docOverflow;
            } else {
                div.parentNode.removeChild(div);
            }

            return !!ret;
        }

    };

    return BackgroundParallax;

})(window, $);
