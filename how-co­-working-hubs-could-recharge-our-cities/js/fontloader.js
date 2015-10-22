(function (window) {
    'use strict';

    var fonts = window.fonts;
    var WebFont = window.WebFont;

    // Load Web fonts.
    window.googleFonts = [];
    window.typekitFonts = [];

    var googleFonts = window.googleFonts,
        typekitFonts = window.typekitFonts;

    var googleFontString = function (family, variants, subsets) {
        var result = family;
        if (!!variants) {
            result += ':' + variants.join(',') + ':' + subsets.join(',');
        }
        return result;
    };

    $.each(fonts, function (family, font) {
        if (font.source === 'google') {
            googleFonts.push(googleFontString(family, font.variants, font.subsets));
        } else if (font.source === 'typekit') {
            typekitFonts.push({
                'id': font.id,
                'variations': font.variants,
                'css_name': font['css_name']
            });
        }
    });

    if (googleFonts.length) {
        WebFont.load({
            google: {
                families: googleFonts
            }
        });
    }

})(window);
