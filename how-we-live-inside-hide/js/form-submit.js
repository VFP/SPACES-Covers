(function ($) {
  'use strict';

  $(function () {
    var submitting = false;


    function collectData (form) {
      if (submitting) {
        return false;
      }

      submitting = true;

      $.ajax({
        type: 'POST',
        url: form.getAttribute('action'),
        data: new FormData(form),
        processData: false,
        contentType: false,
        success: function() {
          $(form).trigger('collect-form-data', {success: true});
          $.magnificPopup.open({
            items: {
              src: form.querySelector('.js-fr-success-form-submit'),
              type: 'inline'
            },
            removalDelay: 300,
            mainClass: 'mfp-slidein'
          }, 0);

          form.reset();
        },
        error: function() {
          $(form).trigger('collect-form-data', {success: false});
          $.magnificPopup.open({
            items: {
              src: form.querySelector('.js-fr-error-form-submit'),
              type: 'inline'
            },
            removalDelay: 300,
            mainClass: 'mfp-slidein'
          }, 0);
        },
        complete: function () {
          submitting = false;
        }
      });
    }


    function onFormSubmit (event) {
      if (this.hasAttribute('data-fr-collect-data')) {
        event.preventDefault();
        collectData(this);
        return;
      }
    }


    function submitClosestForm (event) {
      if (event.type === 'click') {
        event.preventDefault();
      }

      // Submit on Enter key
      var key = event.which || event.keyCode;
      if (event.type === 'keydown' && key !== 13) {
         return;
      }

      var $form = $(this).closest('form');
      var $submitBtn = $form.find('[type="submit"]').first();
      $submitBtn.trigger('click');
    }


    $('.fr-form').on('submit', onFormSubmit);
    $('.fr-linktype-submit').on('click keydown', submitClosestForm);
  });

})(window.jQuery);
