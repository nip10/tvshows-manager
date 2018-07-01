'use strict';

const CONSTANTS = require('./utils/constants');
const functions = require('./functions');

module.exports = {
  login(event) {
    // prevent form submition
    event.preventDefault();
    // remove previous alert message
    $('.alert').remove();
    // remove previous error styles
    $('#login-email').removeClass('is-invalid');
    $('#login-password').removeClass('is-invalid');
    // get email and password
    const email = $('#login-email').val();
    const password = $('#login-password').val();
    // validate email
    if (!email || !validator.isEmail(email)) {
      $('#login-email').addClass('is-invalid');
      return $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email ! </div>');
    }
    // validate password length (8-30 chars)
    if (!password || password.length < 8 || password.length > 30) {
      $('#login-password').addClass('is-invalid');
      return $('#login-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>'
      );
    }
    const currentPath = window.location.pathname;
    const normalizedEmail = validator.normalizeEmail(email);
    $.post('/tsm/auth/login', { email: normalizedEmail, password })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) {
          if (currentPath !== '/tsm' && !currentPath.startsWith('/tsm/auth'))
            return window.location.replace(currentPath);
          return window.location.replace('/tsm/calendar');
        }
        return $('#login-form').before(
          `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
        );
      })
      .fail(jqXHR => {
        const resStatusCode = jqXHR.status;
        if (resStatusCode === 401) {
          $('#login-email').addClass('is-invalid');
          $('#login-password').addClass('is-invalid');
          $('#login-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        } else if (resStatusCode === 422) {
          $('#login-email').addClass('is-invalid');
          $('#login-password').addClass('is-invalid');
          $('#login-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        } else if (resStatusCode === 403) {
          $('#login-form').before(
            `<div class="alert alert-danger" role="alert">
            Error: ${jqXHR.responseJSON.error} \n\r Request a new activation link below
            </div>`
          );
          $('#login-modal .modal-footer').prepend(
            `<button class="btn btn-warning mr-auto" id="resend-activation" data-email=${normalizedEmail}> Request activation email </button>`
          );
          $('#resend-activation').click(e => {
            e.preventDefault();
            this.resendActivation(e);
          });
        } else {
          $('#login-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        }
      });
    return false;
  },
  signup(event) {
    // prevent form submition
    event.preventDefault();
    // remove previous alert message
    $('.alert').remove();
    // remove previous error styles
    $('#signup-email').removeClass('is-invalid');
    $('#signup-password').removeClass('is-invalid');
    // get email and password
    const email = $('#signup-email').val();
    const password = $('#signup-password').val();
    const passwordDuplicate = $('#signup-password-d').val();
    const recaptcha = $('#g-recaptcha-response').val();
    // validate recaptcha
    if (!recaptcha) {
      return $('#signup-form').before(
        '<div class="alert alert-danger" role="alert"> Error: You need to complete the captcha ! </div>'
      );
    }
    // validate email
    if (!email || !validator.isEmail(email)) {
      $('#signup-email').addClass('is-invalid');
      return $('#signup-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>'
      );
    }
    // validate password length (8-30 chars)
    if (!password || !passwordDuplicate || password.length < 8 || password.length > 30) {
      $('#signup-password').addClass('is-invalid');
      $('#signup-password-d').addClass('is-invalid');
      return $('#signup-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>'
      );
    }
    // validate passwords
    if (password !== passwordDuplicate) {
      $('#signup-password').addClass('is-invalid');
      $('#signup-password-d').addClass('is-invalid');
      return $('#signup-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Passwords don\'t match ! </div>'
      );
    }
    const normalizedEmail = validator.normalizeEmail(email);
    $.post('/tsm/auth/signup', {
      email: normalizedEmail,
      password,
      passwordDuplicate,
      recaptcha,
    })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 201) {
          return $('#signup-form').before(
            `<div class="alert alert-success" role="alert">
            An email has been sent to <strong> ${normalizedEmail} </strong> with a activation link.
            If you don't receive it in the next 5min, check you 'spam' folder.
            </div>`
          );
        }
        return $('#signup-form').before(
          `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
        );
      })
      .fail(jqXHR => {
        const resStatusCode = jqXHR.status;
        grecaptcha.reset();
        if (resStatusCode === 401) {
          $('#signup-email').addClass('is-invalid');
          $('#signup-password').addClass('is-invalid');
          $('#signup-password-d').addClass('is-invalid');
          $('#signup-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        } else if (resStatusCode === 422) {
          $('#signup-email').addClass('is-invalid');
          $('#signup-password').addClass('is-invalid');
          $('#signup-password-d').addClass('is-invalid');
          $('#signup-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        } else {
          $('#signup-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        }
      });
    return false;
  },
  resendActivation(event) {
    const { email } = event.target.dataset;
    $.post('/tsm/auth/activate', { email })
      .done((data, textStatus, jqXHR) => {
        $('#login-modal').modal('hide');
        $('#login-modal').on('hidden.bs.modal', () => toastr.success(jqXHR.responseJSON.message));
      })
      .fail(jqXHR => toastr.error(jqXHR.responseJSON.message));
    return false;
  },
  updateEpisodesTable(event) {
    const tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
    const season = event.target.value;
    $.get(`/tsm/tvshows/${tvshowId}/episodes`, { season })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) functions.renderEpisodesTable(data.episodes);
      })
      .fail(() => {
        $('#episodes-table').append(`<p> Error requesting season ${season} episodes. Please try again later. </p>`);
      });
    return false;
  },
  addOrRemoveTvshow(event) {
    // disable button while we wait for the response from the server
    $('#userTvShowState')
      .off('click')
      .prop('disabled', true);
    // get tvshowid from data attr
    const tvshowId = event.target.dataset.tvshowid;
    // get action (add/remove)
    const add = $('#userTvShowState').hasClass('btn-primary');
    if (add) {
      // User is not following this show and wants to add it
      $.post(`/tsm/tvshows/${tvshowId}`, { action: 'add' })
        .done((data, textStatus, jqXHR) => {
          if (jqXHR.status === 200) {
            const tvshowName = $('#tvshow-name')[0].innerText;
            toastr.success(`${tvshowName} added successfully!`);
            $('#userTvShowState')
              .removeClass('btn-primary')
              .addClass('btn-secondary')
              .html('Remove from my shows');
            functions
              .getNumberOfUnwatchedEpisodes()
              .then(({ unwatchedEpisodesCount }) => functions.updateUnwatchedEpisodesCounter(unwatchedEpisodesCount));
          }
        })
        .fail(jqXHR => {
          toastr.error(jqXHR.responseJSON.error);
        })
        .always(() => {
          // re-enable button
          $('#userTvShowState')
            .click(e => this.addOrRemoveTvshow(e))
            .prop('disabled', false);
        });

      return false;
    }
    // User is following this show and wants to remove it
    $.post(`/tsm/tvshows/${tvshowId}`, { action: 'remove' })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) {
          const tvshowName = $('#tvshow-name')[0].innerText;
          toastr.success(`${tvshowName} removed successfully!`);
          $('#userTvShowState')
            .removeClass('btn-secondary')
            .addClass('btn-primary')
            .html('Add to my shows');
          functions
            .getNumberOfUnwatchedEpisodes()
            .then(({ unwatchedEpisodesCount }) => functions.updateUnwatchedEpisodesCounter(unwatchedEpisodesCount));
        }
      })
      .fail(jqXHR => {
        toastr.error(jqXHR.responseJSON.error);
      })
      .always(() => {
        // re-enable button
        $('#userTvShowState')
          .click(e => this.addOrRemoveTvshow(e))
          .prop('disabled', false);
      });
    return false;
  },
  bug(event) {
    // remove previous alert message
    $('.alert').remove();
    // prevent form submition
    event.preventDefault();
    // get user id if logged in
    const bugDescription = $('#bug-description').val();
    // validate text
    if (!bugDescription || !CONSTANTS.sanitize.test(bugDescription)) {
      return $('#bug-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Please fill in the bug description. Only alphanumerical characters! </div>'
      );
    }
    $.post('/tsm/bug', { description: bugDescription })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) {
          $('#bug-form').before(
            '<div class="alert alert-success" role="alert"> Bug submited successfully. Thanks! </div>'
          );
        }
      })
      .fail(jqXHR => {
        $('#bug-form').before(
          `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
        );
      });
    return false;
  },
  forgotPassword(event) {
    // remove previous alert message
    $('.alert').remove();
    // prevent form submition
    event.preventDefault();
    // get email
    const email = $('#forgotpw-email').val();
    const emailDuplicate = $('#forgotpw-email-d').val();
    // get recaptcha
    const recaptcha = $('#g-recaptcha-response-1').val();
    // validate recaptcha
    if (!recaptcha) {
      return $('#forgotpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: You need to complete the captcha ! </div>'
      );
    }
    // validate email
    if (!email || !emailDuplicate || !validator.isEmail(email) || !validator.isEmail(emailDuplicate)) {
      return $('#forgotpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>'
      );
    } else if (email !== emailDuplicate) {
      return $('#forgotpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Email adresses don\'t match ! </div>'
      );
    }
    const normalizedEmail = validator.normalizeEmail(email);
    const normalizedEmailDuplicate = validator.normalizeEmail(emailDuplicate);
    $.post(`/tsm/auth/reset`, { email: normalizedEmail, emailDuplicate: normalizedEmailDuplicate, recaptcha })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) {
          $('#forgotpw-form').before(`<div class="alert alert-success" role="alert"> ${data.message} </div>`);
        } else {
          $('#forgotpw-form').before(
            `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
          );
        }
      })
      .fail(jqXHR => {
        const resStatusCode = jqXHR.status;
        grecaptcha.reset();
        if (resStatusCode === 400) {
          $('#forgotpw-email').addClass('is-invalid');
          $('#forgotpw-email-d').addClass('is-invalid');
        }
        $('#forgotpw-form').before(
          `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
        );
      });
    return false;
  },
  resetPassword(event) {
    // remove previous alert message
    $('.alert').remove();
    // prevent form submition
    event.preventDefault();
    // get email and password
    const password = $('#resetpw-password').val();
    const passwordDuplicate = $('#resetpw-password-d').val();
    const urlParams = window.location.href.split('/');
    const token = urlParams[urlParams.length - 1];
    const email = urlParams[urlParams.length - 2];
    // validate password(s) length
    if (!password || !passwordDuplicate || password.length < 8 || password.length > 30) {
      return $('#resetpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>'
      );
    } else if (password !== passwordDuplicate) {
      // validate passwords match
      return $('#resetpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Passwords don\'t match ! </div>'
      );
    } else if (!email || !validator.isEmail(email)) {
      // validate email
      return $('#resetpw-form').before(
        '<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>'
      );
    } else if (!token) {
      // validate token
      return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid token ! </div>');
    }
    const normalizedEmail = validator.normalizeEmail(email);
    $.post(`/tsm/auth/reset/${normalizedEmail}/${token}`, { password, passwordDuplicate })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status === 200) {
          $('#resetpw-form').before(`<div class="alert alert-success" role="alert"> ${data.message} </div>`);
        } else {
          $('#resetpw-form').before(
            '<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>'
          );
        }
      })
      .fail(jqXHR => {
        const resStatusCode = jqXHR.status;
        if (resStatusCode === 400) {
          $('#resetpw-password').addClass('is-invalid');
          $('#resetpw-password-d').addClass('is-invalid');
        }
        $('#resetpw-form').before(
          `<div class="alert alert-danger" role="alert"> Error: ${jqXHR.responseJSON.error} </div>`
        );
      });
    return false;
  },
  watchlistPosters(event) {
    // get tvshow id
    const tvshowId = event.target.dataset.tvshowid;
    // hide current table
    const visibleWatchlist = $('div[data-tvshowId]:not(.d-none)');
    visibleWatchlist.addClass('d-none');
    // remove highlight from previous active poster
    $('li.highlight').removeClass('highlight');
    // show new table
    $(`div[data-tvshowid=${tvshowId}]`).removeClass('d-none');
    // add highlight to the current poster
    $(`li[data-tvshowid=${tvshowId}]`).addClass('highlight');
  },
  watchlistSelect(event) {
    // get tvshow id
    const tvshowId = event.target.selectedOptions[0].dataset.tvshowid;
    // hide current table
    const visibleWatchlist = $('div[data-tvshowId]:not(.d-none)');
    visibleWatchlist.addClass('d-none');
    // show new table
    $(`div[data-tvshowid=${tvshowId}]`).removeClass('d-none');
    // update "local" counter
    const newCounter = $(`div[data-tvshowid=${tvshowId}] tr`).length;
    $('#mobile-counter').text(newCounter);
  },
  setEpisodeWatched(event) {
    const row = $(event.target)
      .closest('tr')
      .first();
    const tvshowId = $('div[data-tvshowId]:not(.d-none)').data('tvshowid');
    const episodeid = row.data('epid');
    const setWatched = true;
    $.post(`/tsm/tvshows/${tvshowId}/ep`, { setWatched, episodeid })
      .done((data, textStatus, jqXHR) => {
        if (jqXHR.status !== 200) {
          toastr.error('Server error. Please try again later.');
        } else {
          const table = row.closest('table').first();
          const numRows = table.find('tr').length;
          // check if there are no more unwatched episodes
          if (numRows === 1) {
            const container = table.closest('div').first();
            // remove the container (which has the table and season heading)
            container.remove();
            // remove the tvshow poster
            $('li.highlight').remove();
            // add message informing that there are no more unwatched episodes
            $('#page-content-wrapper > div > div:nth-child(2) > div').append(
              "<p> You don't have any unwatched episodes. </p>"
            );
          } else {
            row.remove();
          }
          // update unwatched episodes counter (global)
          const counterGlobal = $('.counter span').text();
          const updatedCounterGlobal = counterGlobal - 1;
          $('.counter span').text(updatedCounterGlobal);
          // update unwatched episodes counter (poster)
          let counterPoster = $(`li[data-tvshowid=${tvshowId}] span`).text();
          $(`li[data-tvshowid=${tvshowId}] span`).text((counterPoster -= 1));
          // update unwatched episides counter (sidebar)
          functions.updateUnwatchedEpisodesCounter(updatedCounterGlobal);
        }
      })
      .fail(jqXHR => {
        toastr.error(jqXHR.responseJSON.error);
      });
    return false;
  },
  toggleSidebar() {
    const isReduced = $('nav').hasClass('reduced');
    if (isReduced) {
      // sidebar is reduced, change to full
      // remove 'reduced' class
      $('nav').removeClass('reduced');
      $('.main-container').removeClass('reduced');
      // switch caret orientation
      $('i.fa-caret-right')
        .removeClass('fa-caret-right')
        .addClass('fa-caret-left');
      // show 'report a bug' button
      $('.beta button').show();
      // re-add transitions
      $('.logo i').css({ transition: 'font-size .3s ease-in-out' });
      $('nav').css({ transition: 'width .3s ease-in-out' });
      $('.main-container').css({ transition: 'padding-left .3s ease-in-out' });
    } else {
      // sidebar is full, change to reduced
      $('nav').addClass('reduced');
      $('.main-container').addClass('reduced');
      // switch caret orientation
      $('i.fa-caret-left')
        .removeClass('fa-caret-left')
        .addClass('fa-caret-right');
      // hide 'report a bug' button
      $('.beta button').hide(100);
      // remove transitions after 'reducing' the sidebar
      window.setTimeout(() => {
        $('.logo i').css({ transition: 'none' });
        $('nav').css({ transition: 'none' });
        $('.main-container').css({ transition: 'none' });
      }, 300);
    }
  },
  toggleSidebarMobile(event) {
    event.preventDefault(event);
    $('#sidebar-wrapper').removeClass('d-none');
    $('#sidebar-wrapper > nav').addClass('mobile');
    $('#topbar-wrapper, #page-content-wrapper')
      .addClass('opacity20')
      .css('pointer-events', 'none');
    $('#toggle-sidebar').addClass('d-none');
    $('#close-sidebar').removeClass('d-none');
  },
  closeSidebar(event) {
    event.preventDefault();
    $('#sidebar-wrapper').addClass('d-none');
    $('#sidebar-wrapper > nav').removeClass('mobile');
    $('#topbar-wrapper, #page-content-wrapper')
      .removeClass('opacity20')
      .css('pointer-events', 'auto');
    $('#toggle-sidebar').removeClass('d-none');
    $('#close-sidebar').addClass('d-none');
  },
  forgotPasswordModal(event) {
    event.preventDefault();
    $('#login-modal')
      .modal('hide')
      .on('hidden.bs.modal', () => {
        $('#forgotpw-modal').modal('show');
        // Remove the 'on' event binding
        $(this).off('hidden.bs.modal');
      });
  },
  setSeasonWatched(event) {
    const { tvshowid, season } = event.target.dataset;
    const episodes = [];
    $(`div[data-tvshowid=${tvshowid}] div[data-season=${season}] table tr`).each((i, el) =>
      episodes.push($(el).data('epid'))
    );
    $.post(`/tsm/tvshows/${tvshowid}/s`, { episodes })
      .done(() => {
        const numEps = $(`table[data-tvshowid=${tvshowid}][data-season=${season}] tbody tr`).length;
        // update unwatched episodes counter (global)
        const globalCounter = Number.parseInt($('.counter span').text(), 10);
        const updatedCounter = globalCounter - numEps;
        $('.counter span').text(updatedCounter);
        // update unwatched episides counter (sidebar)
        functions.updateUnwatchedEpisodesCounter(updatedCounter);
        // update unwatched episodes counter (poster)
        const localCounter = Number.parseInt($(`li[data-tvshowid=${tvshowid}] span`).text(), 10);
        $(`li[data-tvshowid=${tvshowid}] span`).text(localCounter - numEps);
        // remove container of the selected season + tvshow
        $(`div[data-tvshowid=${tvshowid}] div[data-season=${season}]`).remove();
        // check if there are more unwatched episodes from other seasons
        const numSeasons = $(`div[data-tvshowid=${tvshowid}]`).find('table').length;
        if (numSeasons === 0) {
          // remove the container div
          $(`div[data-tvshowid=${tvshowid}]`).remove();
          // remove the tvshow poster
          $('li.highlight').remove();
          // highlight the next tvshow poster
          $('.list-inline-item')
            .first()
            .addClass('highlight');
          // show the container div for the next tvshow
          $('div[data-tvshowid]')
            .first()
            .removeClass('d-none');
          // add message informing that there are no more unwatched episodes
          if (updatedCounter === 0) {
            $('#page-content-wrapper > div > div:nth-child(2) > div').append(
              "<p> You don't have any unwatched episodes. </p>"
            );
          }
        }
      })
      .fail(jqXHR => {
        toastr.error(jqXHR.responseJSON.error);
      });
  },
  changeEpisodeWatchedStatusCalendar(event) {
    const setWatched = event.target.checked;
    const { tvshowid, episodeid } = event.target.dataset;
    $.post(`/tsm/tvshows/${tvshowid}/ep`, { setWatched, episodeid })
      .done(() => {
        if (setWatched) {
          $(`#episode-${episodeid}`)
            .closest('li')
            .addClass('watched');
        } else {
          $(`#episode-${episodeid}`)
            .closest('li')
            .removeClass('watched');
        }
      })
      .fail(jqXHR => {
        toastr.error(jqXHR.responseJSON.error);
      });
  },
  changeEpisodeWatchedStatusTvshow(event) {
    const setWatched = !$(event.target).hasClass('watched');
    const tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
    const episodeid = $(event.target)
      .closest('tr')
      .data('episodeid');
    $.post(`/tsm/tvshows/${tvshowId}/ep`, { setWatched, episodeid })
      .done(() => {
        if (setWatched) {
          $(event.target).addClass('watched');
        } else {
          $(event.target).removeClass('watched');
        }
      })
      .fail(jqXHR => {
        toastr.error(jqXHR.responseJSON.error);
      });
  },
  search(event) {
    event.preventDefault();
    const tvshowName = $('#tvshow-search').val();
    if (tvshowName && tvshowName.length > 3) {
      window.location.replace(`/tsm/tvshows/search_full/${tvshowName}`);
    }
  },
  selectCalendarDay(event) {
    // Get the previous selected day
    const previousSelectedDay = $('.calendar__day.highlight');
    // Get the cellid from the previous selected day
    const previousSelectedDayId = Number.parseInt(previousSelectedDay[0].dataset.cellid, 10);
    // Remove highlight from the previous selected day
    previousSelectedDay.removeClass('highlight');
    // Add highlight to the selected day
    const selectedDay = $(event.currentTarget);
    selectedDay.addClass('highlight');
    // Hide current episode list
    // Note: The 'first()' call is needed for the first time that this function is called.
    // For some unknown reason, the selector $(`#eplist :nth-child(2)`) returns an array
    // of "p"'s instead of the 1st "p".
    $(`#eplist :nth-child(${previousSelectedDayId + 2})`)
      .first()
      .addClass('d-none');
    // Show new episode list
    const selectedDayEpisodeList = Number.parseInt(event.currentTarget.dataset.cellid, 10);
    $(`#eplist :nth-child(${selectedDayEpisodeList + 2})`).removeClass('d-none');
  },
};
