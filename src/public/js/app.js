/* eslint-disable func-names */

import * as handlers from './handlers';
import * as functions from './functions';
import typeahead from './config/typeahead';
import toastrOptions from './config/toastr';
import './cookies';

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
    $('#close-sidebar').click(e => handlers.closeSidebar(e));
    $('.watchlist__list-poster > img').click(e => handlers.watchlistPosters(e));
    $('div[data-tvshowid] table > tbody > tr > td > span.icon-eye').click(e => handlers.setEpisodeWatched(e));
    $('.mark-watched').click(e => handlers.setSeasonWatched(e));
    $('.calendar__table input[type=checkbox]').change(e => handlers.changeEpisodeWatchedStatusCalendar(e));
    $('#episodes-table span.icon-eye').click(e => handlers.changeEpisodeWatchedStatusTvshow(e));
    $('#resend-activation').click(e => handlers.resendActivation(e));
    $('#mobilemenu').click(e => handlers.toggleSidebarMobile(e));
    $('#search-form').submit(e => handlers.search(e));
    $('.watchlist__list select').change(e => handlers.watchlistSelect(e));
    $('.calendar__day').on('touchstart', e => handlers.selectCalendarDay(e));
    $('td.overview span').click(e => handlers.showFullText(e));
    $('#eplist i').click(e => handlers.changeEpisodeWatchedStatusCalendarMobile(e));

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

    // remove validation errors on modal close
    $('#login-modal, #signup-modal, #bug-modal, #resetpw-modal').on('hidden.bs.modal', () => {
      $('.alert').remove();
    });

    $('#signup-modal').on('hidden.bs.modal', () => {
      grecaptcha.reset();
    });

    // Render recaptcha on signup modal open
    // Also, if the recaptcha was rendered once, don't render it again.
    let recaptcha1Rendered = false;
    $('#signup-modal').on('shown.bs.modal', () => {
      if (!recaptcha1Rendered) {
        grecaptcha.render('id1', { sitekey: '6LdypToUAAAAAO1lwC4KARcjELhIhBAL5f2gCagg' });
        recaptcha1Rendered = true;
      }
    });

    // handle reset form modal
    // 'resetPw' comes from pug template which comes from express
    // eslint-disable-next-line no-undef
    if (typeof resetPw !== 'undefined' && resetPw) {
      $('#resetpw-modal').modal('show');
    }
  });

  functions
    .getNumberOfUnwatchedEpisodes()
    .then(({ unwatchedEpisodesCount }) => functions.updateUnwatchedEpisodesCounter(unwatchedEpisodesCount));
})(jQuery);
