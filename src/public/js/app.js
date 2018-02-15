/* eslint-disable func-names */

'use strict';

const handlers = require('./handlers');
const typeahead = require('./config/typeahead');
const toastrOptions = require('./config/toastr');
require('./cookies');

(function($) {
  $(() => {
    // Initialize event handlers
    $('#login-form').submit(e => handlers.login(e));
    $('#signup-form').submit(e => handlers.signup(e));
    $('#resetpw-form').submit(e => handlers.resetPassword(e));
    $('#forgotpw-form').submit(e => handlers.forgotPassword(e));
    $('#season-select').change(e => handlers.updateEpisodesTable(e));
    $('#userTvShowState').click(e => handlers.addOrRemoveTvshow(e));
    $('#bug-form').submit(e => handlers.bug(e));
    $('#toggle-sidebar').click(e => handlers.toggleSidebar(e));
    $('.poster > img').click(e => handlers.watchlistPosters(e));
    $('div[data-tvshowid] table > tbody > tr > td > i').click(e => handlers.setEpisodeWatched(e));
    $('.mark-watched').click(e => handlers.setSeasonWatched(e));
    $('.calendar__table input[type=checkbox]').change(e => handlers.changeEpisodeWatchedStatusCalendar(e));
    $('#episodes-table i.fa.fa-eye').click(e => handlers.changeEpisodeWatchedStatusTvshow(e));

    // Initialize typeahead event handlers
    $('.typeahead')
      .typeahead(...typeahead)
      .on('typeahead:asyncrequest', () => {
        $('.tt-input').addClass('input-loading');
      })
      .on('typeahead:asynccancel typeahead:asyncreceive', () => {
        $('.tt-input').removeClass('input-loading');
      });

    // Setup toastr options
    toastr.options = toastrOptions;

    // redirect when a tvshow is selected
    // TODO: check if this can be moved to the "on" chain above
    $('#tvshow-search').bind('typeahead:select', (obj, datum) => {
      window.location.replace(`/tvshows/${datum.id}`);
    });

    // login modal handler
    $('#login-modal').on('shown.bs.modal', () => {
      $('#login-email').focus();
    });

    // signup modal handler
    $('#signup-modal').on('shown.bs.modal', () => {
      $('#signup-email').focus();
    });

    // bug modal handler
    $('#bug-modal').on('shown.bs.modal', () => {
      $('#bug-email').focus();
    });

    // forgot password modal handler
    $('#login-password-forgot').click(e => {
      e.preventDefault();
      $('#login-modal')
        .modal('hide')
        .on('hidden.bs.modal', () => {
          $('#forgotpw-modal').modal('show');
          // Remove the 'on' event binding
          $(this).off('hidden.bs.modal');
        });
    });

    // handle reset form modal
    // 'resetPw' comes from pug template which comes from express
    // TODO: Create a view for reset password and remove this
    // eslint-disable-next-line no-undef
    if (typeof resetPw !== 'undefined' && resetPw) {
      $('#resetpw-modal').modal('show');
    }
  });
})(jQuery);
