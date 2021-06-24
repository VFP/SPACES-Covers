/**
 * FRScrollEffect v0.1.0
 * Author: FROONT - froont.com
 *
 * Base class for all FROONT Scroll Effects
 */
window.FRScrollEffect = (function (window) {
    'use strict';


    function FRScrollEffect () {
        this.init();

        this._items = [];
        this._areInitialValuesRead = false;
        this.stopped = true;
    }


    FRScrollEffect.prototype = {
        /**
         * Initializes ScrollEffect
         */
        init: function () {},


        /**
         * Destroys ScrollEffect by cleaning and removing all items and listeners
         */
        destroy: function () {
            this.stop();
            this._items = null;
            this._areInitialValuesRead = null;
        },


        /**
         * Starts ScrollEffect,
         * updating of items is controlled by ScrollEffects
         */
        start: function () {
            this.stopped = false;
        },


        /**
         * Stops ScrollEffect and cleans all items,
         * updating of items is controlled by ScrollEffects
         */
        stop: function () {
            this.stopped = true;
            window.cancelAnimationFrame(this.updateValuesAndItems);
            this._items.forEach(this._cleanItem, this);
        },


        /**
         * Un-registers element from ScrollEffect by removing it from items array and
         * cleaning styles added by ScrollEffect, updates remainig items if not isSilent
         *
         * @param {Element} el       - document node from which effect will be removed from
         * @param {Boolean} isSilent - whether items should be updated immediatelly
         */
        unregisterEl: function (el, isSilent) {
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

            if (!isSilent) {
                this.updateValuesAndItems();
            }
        },


        /**
         * Updates each item
         */
        updateItems: function () {},


        /**
         * Reads each item's initial properties and update items
         */
        updateValuesAndItems: function () {},


        /**
         * Looks up ScrollEffect item object by element ID
         *
         * @param  {String} id - ID by which array item will be looked up
         * @return {Object}    - ScrollEffect item object
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
         * Removes inline styles added by ScrollEffect
         *
         * @param {Object} item - ScrollEffect item object
         */
        _cleanItem: function (item) {
            item.isEffectApplied = false;
            item.el.removeAttribute('style');
        }
    };


    return FRScrollEffect;

})(window);





/**
 * FRScrollEffectFade v0.7.0
 * Author: FROONT - froont.com
 *
 * Fades element in when at the top/bottom of page until options.duration % of it's height
 * has been scrolled
 */
window.FRScrollEffectFade = (function (window) {
    'use strict';

    function FRScrollEffectFade() {
      window.FRScrollEffect.call(this);
      this.name = 'fade';
    }

    FRScrollEffectFade.prototype = Object.create(window.FRScrollEffect.prototype);
    FRScrollEffectFade.prototype.constructor = FRScrollEffectFade;


    /**
     * Registers element to ScrollEffect by adding it to items array and
     * updating all items if not isSilent
     *
     * @param {Element} el               - document node to which effect will be added to
     * @param {Object}  options          - effect options for current element
     * @param {String}  options.at       - position in window at which effect will be applied,
     *                                     'top'|'bottom', default is 'top'
     * @param {Number}  options.to       - opacity element will be faded to
     * @param {Number}  options.duration - percents of element height during which effect will be applied,
     *                                     default is 1
     * @param {Boolean} isSilent         - whether items should be updated immediatelly
     */
    FRScrollEffectFade.prototype.registerEl = function (el, options, isSilent) {
        el.style[window.cssTransformProperty] = 'translateZ(0)';

        options = options || {};

        if (options.at !== 'top' && options.at !== 'bottom') {
            options.at = 'top';
        }

        options.from = parseFloat(window.getComputedStyle(el).getPropertyValue('opacity'));
        if (isNaN(options.from)) {
            options.from = 1;
        }

        options.to = parseFloat(options.to);
        if (isNaN(options.to)) {
            options.to = 1;
        }

        // zero not allowed here so ve can do simple `0 || 1` check
        options.duration = parseFloat(options.duration) || 1;

        this._items.push({
            el: el,
            parentEl: el.parentElement,
            parentSpacerEl: null,
            initialTop: 0,
            at: options.at,
            from: options.from,
            to: options.to,
            duration: options.duration
        });

        if (!isSilent && this._areInitialValuesRead) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Un-registers element from ScrollEffect by removing it from items array and
     * cleaning styles added by ScrollEffect, updates remainig items if not isSilent
     *
     * @param {Element} el - document node from which effect will be removed from
     * @param {Boolean} isSilent - whether items should be updated immediatelly
     */
    FRScrollEffectFade.prototype.unregisterEl = function (el, isSilent) {
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

        if (!isSilent) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Updates each item opacity according to calculated value
     * Uses pre-stored initial position and uses scrollY to calculate current position
     * instead of retrieving bounding rect on each scroll for higher FPS
     */
    FRScrollEffectFade.prototype.updateItems = function () {
        if (this.stopped) {
            return;
        }

        // Check if initial values had been read
        if (!this._areInitialValuesRead) {
            return window.requestAnimationFrame(this.updateValuesAndItems);
        }

        this._items.forEach(function (item) {
            var shouldApplyEffect = false,
                pos = item.initialTop - window.scrollY,
                val;

            if (item.height) {
                if (item.at === 'top') {
                    shouldApplyEffect = pos <= 0 && -pos < item.height;
                }
                else {
                    shouldApplyEffect = pos < window.innerHeight && window.innerHeight - pos <= item.height;
                }
            }

            if (shouldApplyEffect) {
                item.isEffectApplied = true;

                if (item.at === 'top') {
                    val = item.from + (item.to - item.from) * (-pos / (item.height * item.duration));
                }
                else {
                    val = item.to - (item.to - item.from) * (window.innerHeight - pos) / (item.height *  item.duration);
                }

                if (item.from >= item.to) {
                    val = Math.min(item.from, Math.max(item.to, val));
                }
                else {
                    val = Math.min(item.to, Math.max(item.from, val));
                }

                if (item.cachedVal !== val) {
                    item.cachedVal = val;
                    item.el.style.opacity = val;
                }

                return;
            }

            // Clean item if effect not applied and not cleaned already
            if (item.isEffectApplied) {
                this._cleanItem(item);
            }
        }, this);
    };


    /**
     * Reads each item's initial position and height
     */
    FRScrollEffectFade.prototype.updateValuesAndItems = function () {
        this._areInitialValuesRead = true;

        this._items.forEach(function (item) {
            // If item has parentSpacerEl it must be FRScrollEffectSticky child -
            // therefore read position from spacer el
            var el = item.parentSpacerEl ? item.parentSpacerEl : item.el;
            var rect = el.getBoundingClientRect();

            item.initialTop = rect.top + window.scrollY;
            item.height = rect.bottom - rect.top;
        });

        this.updateItems();
    };


    /**
     * Updates reference to parent's spacer el and calls updateValuesAndItems() if necessary
     *
     * @param {Event}   event    - Event data
     * @param {Element} el       - element to which spacer element is related to
     * @param {Element} spacerEl - spacer element
     */
    FRScrollEffectFade.prototype.onScrollEffectStickySpacerElChange = function (event, el, spacerEl) {
        if (this.stopped) {
            return;
        }

        var shouldUpdate = false;
        this._items.forEach(function (item) {
            if (item.parentEl && item.parentEl === el) {
                item.parentSpacerEl = spacerEl;
                shouldUpdate = true;
            }
        });

        if (shouldUpdate) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Removes inline styles added by ScrollEffect
     *
     * @param {Object} item - ScrollEffect item object
     */
    FRScrollEffectFade.prototype._cleanItem = function (item) {
        item.isEffectApplied = false;
        item.el.style.opacity = null;
    };


    return FRScrollEffectFade;

})(window);





/**
 * FRScrollEffectScale v0.2.0
 * Author: FROONT - froont.com
 *
 * Scales element when at the top/bottom of page until 100% of it's height has been scrolled
 */

window.FRScrollEffectScale = (function (window) {
    'use strict';

    function FRScrollEffectScale() {
      window.FRScrollEffect.call(this);
      this.name = 'scale';
    }

    FRScrollEffectScale.prototype = Object.create(window.FRScrollEffect.prototype);
    FRScrollEffectScale.prototype.constructor = FRScrollEffectScale;


    /**
     * Registers element to ScrollEffect by adding it to items array and
     * updating all items if not isSilent
     *
     * @param {Element} el               - document node to which effect will be added to
     * @param {Object}  options          - effect options for current element
     * @param {String}  options.at       - position in window at which effect will be applied,
     *                                     'top'|'bottom', default is 'top'
     * @param {Number}  options.scale    - ammount element will be scaled to, default is 1.5
     * @param {Boolean} isSilent         - whether items should be updated immediatelly
     */
    FRScrollEffectScale.prototype.registerEl = function (el, options, isSilent) {
        el.style[window.cssTransformProperty] = 'translateZ(0)';

        var parentEl = el.parentElement;
        if (parentEl) {
            parentEl.style.overflow = 'hidden';
        }

        options = options || {};

        if (options.at !== 'top' && options.at !== 'bottom') {
            options.at = 'top';
        }

        // zero not allowed here so we can do simple `0 || 1.5` check
        options.scale = parseFloat(options.scale) || 1.5;

        this._items.push({
            el: el,
            parentEl: parentEl,
            parentSpacerEl: null,
            initialTop: 0,
            at: options.at,
            scale: options.scale,
            currentScale: 1
        });

        if (!isSilent && this._areInitialValuesRead) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Updates each item scale according to calculated value
     * Uses pre-stored initial position and uses scrollY to calculate current position
     * instead of retrieving bounding rect on each scroll for higher FPS
     */
    FRScrollEffectScale.prototype.updateItems = function () {
        if (this.stopped) {
            return;
        }

        // Check if initial values had been read
        if (!this._areInitialValuesRead) {
            return window.requestAnimationFrame(this.updateValuesAndItems);
        }

        this._items.forEach(function (item) {
            var shouldApplyEffect = false,
                pos = item.initialTop - window.scrollY,
                val;

            if (item.height) {
                if (item.at === 'top') {
                    shouldApplyEffect = pos <= 0 && -pos < item.height + item.extraHeight / 2;
                }
                else {
                    shouldApplyEffect = pos < window.innerHeight + item.extraHeight / 2 && window.innerHeight - pos <= item.height;
                }
            }

            if (shouldApplyEffect) {
                item.isEffectApplied = true;

                if (item.at === 'top') {
                    val = -pos / item.height;
                }
                else {
                    val = 1 - (window.innerHeight - pos) / item.height;
                }

                val = 1 + val * (item.scale - 1);
                if (item.scale >= 1) {
                    val = Math.min(item.scale, val);
                }
                else {
                    val = Math.max(item.scale, val);
                }

                if (item.currentScale !== val) {
                    item.currentScale = val;
                    item.el.style[window.cssTransformProperty] = 'translateZ(0) scale(' + val + ')';
                }

                return;
            }

            // Clean item if effect not applied and not cleaned already
            if (item.isEffectApplied) {
                this._cleanItem(item);
            }
        }, this);
    };


    /**
     * Reads each item's initial position and height
     */
    FRScrollEffectScale.prototype.updateValuesAndItems = function () {
        this._areInitialValuesRead = true;

        this._items.forEach(function (item) {
            // If item has parentSpacerEl it must be FRScrollEffectSticky child -
            // therefore read position from spacer el
            var el = item.parentSpacerEl ? item.parentSpacerEl : item.el;
            var rect = el.getBoundingClientRect();

            // Translate top position and height depending on current scale
            item.height = (rect.bottom - rect.top) / item.currentScale;
            var scaleDiff = (rect.bottom - rect.top) - item.height;
            item.initialTop = rect.top + scaleDiff / 2 + window.scrollY;

            // Calcutate extra height gained by scaling, ignore negative
            item.extraHeight = Math.max(0, item.height * item.scale - item.height);
        });

        this.updateItems();
    };


    /**
     * Updates reference to parent's spacer el and calls updateValuesAndItems() if necessary
     *
     * @param {Event}   event    - Event data
     * @param {Element} el       - element to which spacer element is related to
     * @param {Element} spacerEl - spacer element
     */
    FRScrollEffectScale.prototype.onScrollEffectStickySpacerElChange = function (event, el, spacerEl) {
        if (this.stopped) {
            return;
        }

        var shouldUpdate = false;
        this._items.forEach(function (item) {
            if (item.parentEl && item.parentEl === el) {
                item.parentSpacerEl = spacerEl;
                shouldUpdate = true;
            }
        });

        if (shouldUpdate) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Removes inline styles added by ScrollEffect
     *
     * @param {Object} item - ScrollEffect item object
     */
    FRScrollEffectScale.prototype._cleanItem = function (item) {
        item.isEffectApplied = false;
        item.el.style[window.cssTransformProperty] = 'translateZ(0)';
    };


    return FRScrollEffectScale;

})(window);







/**
 * FRScrollEffectSticky v0.7.0
 * Author: FROONT - froont.com
 *
 * Sticks element at the top/bottom of page until 100% of it's height has been scrolled
 */
window.FRScrollEffectSticky = (function (window, $) {
    'use strict';

    function FRScrollEffectSticky() {
      window.FRScrollEffect.call(this);
      this.name = 'sticky';
    }

    FRScrollEffectSticky.prototype = Object.create(window.FRScrollEffect.prototype);
    FRScrollEffectSticky.prototype.constructor = FRScrollEffectSticky;


    /**
     * Registers element to ScrollEffect by adding it to items array and
     * updating all items if not isSilent
     *
     * @param {Element} el
     * @param {Object}  options
     * @param {String}  options.at       - position in window at which effect will be applied,
     *                                     'top'|'bottom', default is 'top'
     * @param {Number}  options.extra - stick element for extra percents, default is 0
     * @param {Number}  options.zIndex - z-index to set on element when sticky, default is 0
     * @param {Boolean} isSilent - whether items should be updated immediatelly
     */
    FRScrollEffectSticky.prototype.registerEl = function (el, options, isSilent) {
        el.style[window.cssTransformProperty] = 'translateZ(0)';

        options = options || {};

        if (options.at !== 'top' && options.at !== 'bottom') {
            options.at = 'top';
        }

        options.extra = parseFloat(options.extra) || 0;

        options.zIndex = parseInt(options.zIndex) || 0;
        if (options.zIndex < 0) {
            if (console) {
                console.warn('FRScrollEffectSticky: Negative z-index values might cause rendering issues on Safari and possibly other browsers. Setting to 0.');
            }
            options.zIndex = 0;
        }

        this._items.push({
            el: el,
            parentEl: el.parentElement,
            spacerEl: null,
            initialTop: 0,
            height: 0,
            at: options.at,
            extra: options.extra,
            zIndex: options.zIndex
        });

        if (!isSilent && this._areInitialValuesRead) {
            this.updateValuesAndItems();
        }
    };


    /**
     * Updates each item position according to calculated value
     * Uses pre-stored initial position and uses scrollY to calculate current position
     * instead of retrieving bounding rect on each scroll for higher FPS
     */
    FRScrollEffectSticky.prototype.updateItems = function () {
        if (this.stopped) {
            return;
        }

        // Check if initial values had been read
        if (!this._areInitialValuesRead) {
            return window.requestAnimationFrame(this.updateValuesAndItems);
        }

        this._items.forEach(function (item) {
            var shouldApplyEffect = false,
                pos = item.initialTop - window.scrollY;


            if (item.height) {
                if (item.at === 'top') {
                    shouldApplyEffect = pos <= 0 && -pos < item.height * (1 + item.extra);
                }
                else {
                    shouldApplyEffect = pos < window.innerHeight && window.innerHeight - pos <= item.height * (1 + item.extra);
                }
            }

            if (shouldApplyEffect) {
                if (!item.isEffectApplied) {
                    item.isEffectApplied = true;

                    item.el.style.position = 'fixed';

                    item.el.style[item.at] = '0';
                    item.el.style.zIndex = item.zIndex;

                    if (!item.spacerEl) {
                        item.spacerEl = document.createElement('div');
                        item.spacerEl.id = '__FRScrollEffectSticky_spacer__' + item.el.id;
                        item.spacerEl.style.width = '100%';
                        item.spacerEl.style.height = item.height + 'px';
                        item.spacerEl.style.position = 'relative';

                        item.parentEl.insertBefore(item.spacerEl, item.el);
                        $(window).trigger('FRScrollEffectSticky:spacerElChange', [item.el, item.spacerEl]);
                    }
                }

                return;
            }

            // Clean item if effect not applied and not cleaned already
            if (item.isEffectApplied) {
                this._cleanItem(item);
            }

        }, this);
    };


    /**
     * Reads each item's initial position and height, updates spacer el size
     */
    FRScrollEffectSticky.prototype.updateValuesAndItems = function () {
        this._areInitialValuesRead = true;

        this._items.forEach(function (item) {
            var el = item.spacerEl ? item.spacerEl : item.el;
            var rect = el.getBoundingClientRect();

            item.initialTop = rect.top + window.scrollY;
            item.height = rect.bottom - rect.top;

            this._updateSpacerSize(item);
        }, this);

        this.updateItems();

        // Update z-index after effect is applied to avoid overriding z-index
        this._items.forEach(this._setZIndexToSiblings, this);
    };


    /**
     * Sets z-index to all previous/next siblings depending on item `options.at` value if necessary.
     */
    FRScrollEffectSticky.prototype._setZIndexToSiblings = function (item) {
        var sibling = item.at === 'bottom' ? item.el.previousElementSibling : item.el.nextElementSibling;
        var counter = 1;

        while (sibling) {
            var siblingZIndex = -1;

            var style = window.getComputedStyle(sibling);
            if (style) {
                siblingZIndex = parseInt(style.getPropertyValue('z-index'));
            }

            // Don't modify z-index if sibling has FRScrollEffectSticky applied to it
            var itemWithScrollEffect = this._findItemById(sibling.id);
            if (!itemWithScrollEffect || !itemWithScrollEffect.isEffectApplied) {
                sibling.style.position = 'relative';

                if (!siblingZIndex || siblingZIndex < item.zIndex + counter) {
                    sibling.style.zIndex = item.zIndex + counter;
                }
            }

            sibling = item.at === 'bottom' ? sibling.previousElementSibling : sibling.nextElementSibling;
            counter++;
        }
    };


    /**
     * Updates spacer el size
     *
     * @param {Object} item - ScrollEffect item object
     */
    FRScrollEffectSticky.prototype._updateSpacerSize = function (item) {
        if (item.spacerEl && item.spacerEl.style.height !== item.height + 'px') {
            item.spacerEl.style.height = item.height + 'px';
        }
    };


    /**
     * Removes inline styles added by ScrollEffect, removes spacer el
     *
     * @param {Object} item - ScrollEffect item object
     */
    FRScrollEffectSticky.prototype._cleanItem = function (item) {
        item.isEffectApplied = false;

        item.el.style.position = null;
        item.el.style[item.at] = null;
        item.el.style.zIndex = null;

        if (item.spacerEl) {
            item.spacerEl.parentElement.removeChild(item.spacerEl);
            $(window).trigger('FRScrollEffectSticky:spacerElChange', [item.el, null]);
            item.spacerEl = null;
        }

        // Update z-index of siblings
        this._items.forEach(this._setZIndexToSiblings, this);
    };


    return FRScrollEffectSticky;

})(window, jQuery);








/**
 * FRScrollEffects v0.2.0
 * Author: FROONT - froont.com
 *
 * Interface for individual scroll effects
 */
window.FRScrollEffects = (function (window, $) {
    'use strict';

    var self;

    function FRScrollEffects () {
        self = this;
        self.init();
    }


    FRScrollEffects.prototype = {
        _effects: [],
        _isInited: false,
        _isAfRequested: false,
        _prevDocumentHeight: null,

        stopped: true,


        /**
         * Initializes ScrollEffects, inits available scroll effects,
         * finds and registers elements with effect applied
         */
        init: function () {
            if (window.isMobile) {
                return;
            }

            if (window.FRScrollEffectSticky) {
                this._effectSticky = new window.FRScrollEffectSticky();
                this._effects.push(this._effectSticky);
            }

            if (window.FRScrollEffectFade) {
                this._effectFade = new window.FRScrollEffectFade();
                this._effects.push(this._effectFade);
            }

            if (window.FRScrollEffectScale) {
                this._effectScale = new window.FRScrollEffectScale();
                this._effects.push(this._effectScale);
            }

            if (!this._effects.length) {
                return;
            }

            this._effects.forEach(function (effect) {
                effect.init();
            });

            this._findAndRegisterEls();
        },


        /**
         * Destroys ScrollEffects by destroying all scroll effects and removing listeners
         */
        destroy: function () {
            this._removeListeners();

            this._effects.forEach(function (effect) {
                effect.destroy();
            });

            this._effects = null;
            this._isAfRequested = null;
            this._prevDocumentHeight = null;
        },


        /**
         * Starts ScrollEffects by adding listeners and starting each scroll effect,
         * and updating all items
         */
        start: function () {
            this.stopped = false;

            this._effects.forEach(function (effect) {
                effect.start();
            });

            window.requestAnimationFrame(this.updateValuesAndItems);
            this._addListeners();
        },


        /**
         * Stops ScrollEffects by removing listeners and stopping each scroll effect
         */
        stop: function () {
            this.stopped = true;

            this._removeListeners();

            this._effects.forEach(function (effect) {
                effect.stop();
            });
        },


        /**
         * Registers element to corresponding ScrollEffect
         *
         * @param {Element} el       - document node to which effect will be added to
         * @param {String}  effect   - ScrollEffect identifying string
         * @param {Object}  options  - effect options for current element, depends on effect applied
         * @param {Boolean} isSilent - whether items should be updated immediatelly
         */
        registerEl: function (el, effect, options, isSilent) {
            if (window.isMobile) {
                return;
            }

            if (this._effectSticky && effect === this._effectSticky.name) {
                return this._effectSticky.registerEl(el, options, isSilent);
            }

            if (this._effectFade && effect === this._effectFade.name) {
                return this._effectFade.registerEl(el, options, isSilent);
            }

            if (this._effectScale && effect === this._effectScale.name) {
                return this._effectScale.registerEl(el, options, isSilent);
            }
        },


        /**
         * Un-registers element from corresponding ScrollEffect,
         * updates each ScrollEffect remainig items if not isSilent
         *
         * @param {Element} el       - document node from which effect will be removed from
         * @param {String}  effect   - ScrollEffect identifying string
         * @param {Boolean} isSilent - whether items should be updated immediatelly
         */
        unregisterEl: function (el, effect, isSilent) {
            if (this._effectSticky && effect === this._effectSticky.name) {
                return this._effectSticky.unregisterEl(el, isSilent);
            }

            if (this._effectFade && effect === this._effectFade.name) {
                return this._effectFade.unregisterEl(el, isSilent);
            }

            if (this._effectScale && effect === this._effectScale.name) {
                return this._effectScale.unregisterEl(el, isSilent);
            }

            // Unregister all effects if `effect` didn't match any
            return this._effects.forEach(function (effect) {
                effect.unregisterEl(el, isSilent);
            });
        },


        /**
         * Updates each ScrollEffect items
         */
        updateItems: function () {
            if (self.stopped) {
                return;
            }

            self._effects.forEach(function (effect) {
                effect.updateItems();
            });

            self._isAfRequested = false;
        },


        /**
         * Updates each ScrollEffect initial values and items
         */
        updateValuesAndItems: function () {
            self._prevDocumentHeight = document.body.scrollHeight;

            self._effects.forEach(function (effect) {
                effect.updateValuesAndItems();
            });

            self._isAfRequested = false;
        },


        /**
         * Finds all document nodes with ScrollEffect class and registers to corresponding ScrollEffect
         */
        _findAndRegisterEls: function () {
            $('.fr-scroll-effect-sticky').each(function(){
                var data = $(this).data();
                var options = {
                    'at': data.frScrollEffectAt,
                    'extra': data.frScrollEffectExtra,
                    'zIndex': data.frScrollEffectZindex
                };
                self.registerEl(this, 'sticky', options, true);
            });

            $('.fr-scroll-effect-fade').each(function(){
                var data = $(this).data();
                var options = {
                    'at': data.frScrollEffectAt,
                    'to': data.frScrollEffectTo,
                    'duration': data.frScrollEffectDuration
                };
                self.registerEl(this, 'fade', options, true);
            });

            $('.fr-scroll-effect-scale').each(function(){
                var data = $(this).data();
                var options = {
                    'at': data.frScrollEffectAt,
                    'scale': data.frScrollEffectScale
                };
                self.registerEl(this, 'scale', options, true);
            });
        },


        /**
         * Adds event listeners
         */
        _addListeners: function () {
            $(window).on('resize', this._onResize);
            $(window).on('scroll', this._onScroll);

            if (this._effectSticky) {
                $(window).on('FRScrollEffectSticky:spacerElChange', this._onScrollEffectStickySpacerElChange);
            }
        },


        /**
         * Removed event listeners
         */
        _removeListeners: function () {
            window.cancelAnimationFrame(this.updateValuesAndItems);
            window.cancelAnimationFrame(this.updateItems);

            $(window).off('resize', this._onResize);
            $(window).off('scroll', this._onScroll);
            $(window).off('FRScrollEffectSticky:spacerElChange', this._onScrollEffectStickySpacerElChange);
        },


        /**
         * Window resize event handler
         */
        _onResize: function () {
            window.requestAnimationFrame(self.updateValuesAndItems);
        },


        /**
         * Window scroll event handler
         */
        _onScroll: function () {
            // Check if document height has changed without resize event
            // Can happen when webfonts load

            if (self._prevDocumentHeight !== document.body.scrollHeight) {
                return window.requestAnimationFrame(self.updateValuesAndItems);
            }

            if (!self._isAfRequested) {
                self._isAfRequested = true;
                window.requestAnimationFrame(self.updateItems);
            }
        },


        /**
         * FRScrollEffectSticky spacer el change handler.
         * Calls onScrollEffectStickySpacerElChange on each effect.
         *
         * @param {Event}   event    - Event data
         * @param {Element} el       - element to which spacer element is related to
         * @param {Element} spacerEl - spacer element
         */
        _onScrollEffectStickySpacerElChange: function (event, el, spacerEl) {
            self._effects.forEach(function (effect) {
                if (typeof effect.onScrollEffectStickySpacerElChange === 'function') {
                    effect.onScrollEffectStickySpacerElChange(event, el, spacerEl);
                }
            });
        }
    };


    return FRScrollEffects;

})(window, jQuery);
