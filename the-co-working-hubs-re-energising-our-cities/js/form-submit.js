(function ($) {
    'use strict';

    $(function () {
        $('.fr-linktype-submit').on('click', function (e) {
            e.preventDefault();

            var $closestForm = $(this).closest('form');
            if ($closestForm) {
                $closestForm.submit();
            }

        }).on('keydown', function (e) {
            // Submit on Enter key
            var key = e.which || e.keyCode;

            if (key === 13) {
                var $closestForm = $(this).closest('form');

                if ($closestForm) {
                    $closestForm.submit();
                }
            }
        });
    });
})(window.jQuery);
