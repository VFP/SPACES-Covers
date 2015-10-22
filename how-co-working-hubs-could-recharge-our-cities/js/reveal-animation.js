window.RevealAnimation = (function (window, Waypoint, $) {
    'use strict';

    var self,

        /**
         * RequestAnimationFrame polyfill.
         */
        _requestAnimFrame = (function () {

            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||

                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
        }(window)),

        /**
         * CancelAnimationFrame polyfill.
         */
        _cancelAnimationFrame = (function () {

            return window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.webkitCancelRequestAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.mozCancelRequestAnimationFrame ||

                function (id) {
                    clearTimeout(id);
                };
        }(window));


    /**
     * Reveal Animation object, ensures that animations plays nice
     *
     * @param {Object} config - configuration for reveal Animation
     * @param {boolean} [config.mobile = true] - Weather to run animations on mobile devices.
     * @param {boolean} [config.repeat = true] - Weather to repeat the animations on subsequent reveals.
     * @param {string} [config.resultClass = 'fr-anim-result'] - Animation end state class name.
     * @param {string} [config.classPrefix = 'fr-anim'] - Prefix to use for animation classes extracted from
     *                                                    data attribute. Resulting class name will be
     *                                                    config.classPrefix + class in data attribute.
     * @param {string} [config.animationMarker = '.fr-having-animation'] - jQuery selector for elements to animate.
     * @param {string} [config.animationDataAttr = 'fr-animation'] = data attribute witch contains animation classes.
     */
    function RevealAnimation(config) {
        self = this;
        self.animations = {};
        self.elements = [];
        self.index = 1;
        self.initialConfig = self.config = $.extend({}, self.defaults, config);

        if (window.isMobile && !self.config.mobile || !self._isSupported()) {
            self.destroy();
            return;
        }

        // Safari/OSX needs some additional time to get correct element locations.
        setTimeout(function() {
            self.init();
        }, 100);
    }

    RevealAnimation.prototype = {

        defaults: {
            mobile: true,
            repeat: true,
            resultClass: 'fr-anim-result',  // resets the state of animation class causing animation
            classPrefix: 'fr-anim',  // prefix to use for animation classes extracted from data attribute
            animationMarker: '.fr-having-animation',  // jQuery selector
            animationDataAttr: 'fr-animation'  // data attribute which contains animation classes: 'data-' + animationDataAttr
        },


        /**
         * Queries the DOM, builds animations.
         * @param {Object} config - Configuration options that will override the instance configuration.
         *                          For option keys see constructor.
         */
        init: function (config) {
            var index, animation,
                $elems = $(self.config.animationMarker);

            // Override config with passed object, if any
            self.config = $.extend({}, self.initialConfig, config);

            $.each($elems, function (i, el) {
                if (self.elements.indexOf(el) === -1) {
                    index = self.index++;
                    animation = self.animations[index] = {element: el};
                    animation.animationFrame = null;

                    // if animations need to be repeated, create animation reset waypoint
                    // to avoid the flicker of elements
                    if (self.config.repeat) {
                        animation.reset = self._createResetWaypoint(el);

                    } else {
                        animation.reset = null;
                    }
                    self.elements.push(el);

                    // if this element is already in elems object,
                    // destroy it's waypoint and recreate it to play the new animation if in view
                } else {
                    animation = self._getAnimationByElement(el);

                    if (animation.waypoint) {
                        animation.waypoint.destroy();
                    }
                    self._stopRuningAnimation(animation);
                }
                animation.animationClass = self._createAnimationClass(el);
                animation.waypoint = self._createWaypoint(el);
                animation.seen = false;
            });
        },


        /**
         * animates element using animation
         *
         * @param {Object} animation - animation Object from self.animations
         */
        animate: function (animation) {
            if (!animation || animation.seen || !animation.animationClass) {
                return false;
            }
            var $el = $(animation.element);

            // if animation is playing, stop it
            self._stopRuningAnimation(animation);

            // removeing resulting state, if it's there
            $el.removeClass(self.config.resultClass);

            // adding initial state, if it's not added already
            $el.addClass(animation.animationClass);

            // reqiuesting animation frame for animation to happen
            animation.animationFrame = _requestAnimFrame(function () {
                // adding resulting state and doing animation
                $el.addClass(self.config.resultClass);

                // when transition ends remove all animation classes
                $el.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function (e) {
                    if ($el.is(e.target)) {
                        // after css animation is done remove animation classes
                        $el.removeClass(self.config.resultClass + ' ' + animation.animationClass);
                        animation.animationFrame = null;
                        $el.off('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd');
                    }
                });
            });
            animation.seen = true;

            return true;
        },


        /**
         * destroys this object and clears the memory
         */
        destroy: function () {
            if (!self.animations) {
                return;
            }

            for (var i in self.animations) {

                if (self.animations.hasOwnProperty(i)) {
                    var animation = self.animations[i];

                    if (animation.waypoint) {
                        animation.waypoint.destroy();
                    }
                    if (animation.reset) {
                        animation.reset.destroy();
                    }

                    var $el = $(animation.element);
                    $el.removeClass(animation.animationClass);
                }
            }

            self.waypoints = null;
            self.elements = [];
            self.animations = {};
        },

        /**
         * Checks weather CSS Transitions are supported by browser
         */
        _isSupported: function () {
            var sensor = document.createElement('sensor'),
                cssPrefixTransition = [
                    'webkit',  /* Webkit understands both lower and upper case prefixes.
                                  Using lower because dumped objects return lower
                                  e.g. (console.log(document.body.style)) */
                    'Moz',  // FireFox understands only uppercase
                    'O',
                    'transition'],
                tests = (cssPrefixTransition.join('Transition,')).split(',');

            for (var i = 0; i < tests.length; i++) {

                if (tests[i] in sensor.style) {
                    return true;
                }
            }

            return false;
        },


        /**
         * creates and applies the animation class of the element
         * animation class is the base state of element
         *
         * @param {Element} element - DOM Element Node on witch the animation will be played
         */
        _createAnimationClass: function (element) {
            var animationString = element.getAttribute('data-' + self.config.animationDataAttr),
                animationClass = '';

            if (animationString) {
                var animations = animationString.split(' ');
                element.removeAttribute('data-' + self.config.animationDataAttr);

                animations.forEach(function (animation) {
                    animationClass += (' ' + self.config.classPrefix + '-' + animation);
                });
            }
            $(element).addClass(animationClass);

            return animationClass.trim();
        },


        /*
         * creates waypoint in witch the animation will be played
         *
         * @param {Element} element - DOM Element Node on witch the animation will be played
         */
        _createWaypoint: function (element) {
            return new Waypoint({
                element: element,
                handler: function (direction) {
                    var animation = self._getAnimationByElement(this.element);

                    // if scrolling down, play the animation
                    if (direction === 'down' && !animation.seen) {

                        if (!self.animate(animation) || !self.config.repeat) {
                            this.destroy();
                        }
                    }
                },
                offset: '90%'
            });
        },


        /**
         * Creates Waypoint that resets animation state for repeating
         *
         * @param {Element} element - DOM Element Node on witch the animation will be reset
         */
        _createResetWaypoint: function (element) {
            return new Waypoint({
                element: element,
                handler: function (direction) {

                    if (direction === 'up') {
                        var animation = self._getAnimationByElement(this.element);

                        if (animation.seen) {
                            self._stopRuningAnimation(animation);
                            $(this.element).addClass(animation.animationClass);
                            animation.seen = false;
                        }
                    }
                },
                offset: '100%'
            });
        },


        /**
         * returns animation element using dom element
         *
         * @param {Element} element - DOM Element Node
         */
        _getAnimationByElement: function (element) {
            for (var i in self.animations) {
                if (self.animations[i].element === element) {
                    return self.animations[i];
                }
            }

            return false;
        },


        /**
         * stops any executing animations on element using animation object
         * must pass animation from self.animations, not a dom element
         *
         * @param {Object} animation - animation Object from self.animations
         */
        _stopRuningAnimation: function (animation) {
            if (animation.animationFrame) {
                var $el = $(animation.element);

                $el.removeClass(self.config.resultClass + ' ' + animation.animationClass);
                $el.off('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd');
                _cancelAnimationFrame(animation);
                animation.animationFrame = null;
            }
        }
    };

    return RevealAnimation;

})(window, Waypoint, $);


