/* eslint-disable func-names */

'use strict';

const handlers = require('./handlers');
const functions = require('./functions');
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
    $('#login-password-forgot').click(e => handlers.forgotPasswordModal(e));
    $('#season-select').change(e => handlers.updateEpisodesTable(e));
    $('#userTvShowState').click(e => handlers.addOrRemoveTvshow(e));
    $('#bug-form').submit(e => handlers.bug(e));
    $('#toggle-sidebar').click(e => handlers.toggleSidebar(e));
    $('#close-sidebar').click(e => handlers.closeSidebar(e));
    $('.poster > img').click(e => handlers.watchlistPosters(e));
    $('div[data-tvshowid] table > tbody > tr > td > i').click(e => handlers.setEpisodeWatched(e));
    $('.mark-watched').click(e => handlers.setSeasonWatched(e));
    $('.calendar__table input[type=checkbox]').change(e => handlers.changeEpisodeWatchedStatusCalendar(e));
    $('#episodes-table i.fa.fa-eye').click(e => handlers.changeEpisodeWatchedStatusTvshow(e));
    $('#resend-activation').click(e => handlers.resendActivation(e));
    $('#mobilemenu').click(e => handlers.toggleSidebarMobile(e));
    $('#search-form').submit(e => handlers.search(e));
    $('.watchlist-list select').change(e => handlers.watchlistSelect(e));
    $('.calendar__day').on('touchstart', e => handlers.selectCalendarDay(e));
    $('td.overview span').click(e => handlers.showFullText(e));

    const isMobile = window.matchMedia('only screen and (max-width: 760px)');

    // Initialize typeahead event handlers (desktop only)
    if (!isMobile.matches) {
      $('.typeahead')
        .typeahead(...typeahead)
        .on('typeahead:asyncrequest', () => {
          $('.tt-input').addClass('input-loading');
        })
        .on('typeahead:asynccancel typeahead:asyncreceive', () => {
          $('.tt-input').removeClass('input-loading');
        });
    }

    // Setup toastr options
    toastr.options = toastrOptions;

    // redirect when a tvshow is selected
    $('#tvshow-search').bind('typeahead:select', (obj, datum) => {
      window.location.replace(`/tsm/tvshows/${datum.id}`);
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

    // handle reset form modal
    // 'resetPw' comes from pug template which comes from express
    // TODO: Create a view for reset password and remove this
    // eslint-disable-next-line no-undef
    if (typeof resetPw !== 'undefined' && resetPw) {
      $('#resetpw-modal').modal('show');
    }
  });

  functions
    .getNumberOfUnwatchedEpisodes()
    .then(({ unwatchedEpisodesCount }) => functions.updateUnwatchedEpisodesCounter(unwatchedEpisodesCount));
})(jQuery);
