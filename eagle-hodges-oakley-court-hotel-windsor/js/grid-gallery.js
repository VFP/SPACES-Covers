/**
 * FrGridGallery v1.0
 * Author: FROONT - froont.com
 */
window.Froont = window.Froont || {};

window.Froont.FrGridGallery = (function (window, $) {
  'use strict';

  function FrGridGallery(el, options) {
    this.el = $(el);
    this.options = $.extend(
      {
        gallery: {
          enabled: true
        }
      },
      options
    );

    this.gallery = null;
    this.items = [];

    this.init();
  }


  FrGridGallery.prototype = {

    /**
     * Initializes gallery
     */

    init: function () {
      this.items = this._getGalleryItems(this.el);

      if (this.items.length) {
        this.gallery = $.magnificPopup.instance;

        var items = this.items.map(function (item) {
          return {
            type: 'image',
            src: item.image,
            title: item.title
          };
        });

        this.items.forEach(function (galleryItem, i) {
          galleryItem.element.addClass('fr-grid-gallery-item');

          galleryItem.element.on('click', function (e) {
            e.preventDefault();

            this.gallery.open(
              $.extend(
                this.options,
                {
                  items: items,
                  index: i
                }
              )
            );
          }.bind(this));
        }, this);
      }
    },


    _getBackgroundImage: function (element) {
      var bg = element.css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      return bg === 'none' ? false : bg;
    },


    _getGalleryItems: function (gallery) {
      var self = this;
      var galleryItems = [];

      gallery.children().each(function (i, gridItem) {
        var gridItem = $(gridItem);

        // If widget itself has background image
        var gridItemBackground = self._getBackgroundImage(gridItem);

        if (gridItemBackground) {
          galleryItems.push({
            element: gridItem,
            image: gridItemBackground,
            title: gridItem.attr('title')
          });
          return true;
        }

        // If no children
        if (!gridItem.children().length) {
          return true;
        }

        // Froont image widget is wrapped in DIV
        // so we need to look in DIV for first child IMG element
        gridItem.children().each(function (j, gridItemChildren) {
          var gridItemChildren = $(gridItemChildren);

          // If widget has background image
          var gridItemChildrenBackground = self._getBackgroundImage(gridItemChildren);

          if (gridItemChildrenBackground) {
            galleryItems.push({
              element: gridItem,
              image: gridItemChildrenBackground,
              title: gridItemChildren.attr('title')
            });
            return false;
          }

          // If widget itself is image
          if (gridItemChildren.prop('tagName') === 'IMG') {
            galleryItems.push({
              element: gridItem,
              image: gridItemChildren.attr('src'),
              title: gridItemChildren.attr('title')
            });
            return false;
          }

          // If one of first level elements is image
          var firstChild = gridItemChildren.children().first();
          if (firstChild && firstChild.prop('tagName') === 'IMG') {
            galleryItems.push({
              element: gridItem,
              image: firstChild.attr('src'),
              title: firstChild.attr('title')
            });
            return false;
          }
        });
      });

      return galleryItems;
    },


    /**
     * Destroys gallery by removing all listeners
     */
    destroy: function () {
      if (!this.gallery) { return; }
      this.gallery.close();
      this.gallery = null;

      if (this.items.length) {
        this.items.forEach(function (galleryItem, i) {
          galleryItem.element.removeClass('fr-grid-gallery-item');
          galleryItem.element.off('click');
        });

        this.items = [];
      }
    }
  };

  return FrGridGallery;

})(window, jQuery);
