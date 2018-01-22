'use strict';

function renderEpisodesTable(episodes) {
    const table = $('#episodes-table > tbody');
    table.empty();
    episodes.forEach((episode) => {
        table.append(`<tr> <td>${episode.num}</td> <td class="name">${episode.name}</td> <td class="airdate">${episode.airdate}</td> <td><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>`);
    }, this);
}

const sanitize = new RegExp(/^[\w\-\s.,;:]+$/);

$(() => {
    // set-up toastr options (notifications)
    toastr.options = {
        closeButton: true,
        newestOnTop: true,
        positionClass: 'toast-bottom-right',
        preventDuplicates: false,
        onclick: null,
        showDuration: '300',
        hideDuration: '1000',
        timeOut: '5000',
        extendedTimeOut: '1000',
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut',
    };
    // handle login modal
    $('#login-modal').on('shown.bs.modal', () => {
        $('#login-email').focus();
    });
    // login form
    $('#login-form').submit((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        // validate email
        if (!validator.isEmail(email)) {
            return $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email ! </div>');
        }
        // validate password length (8-30 chars)
        if (password.length < 8 || password.length > 30) {
            return $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>');
        }
        $.post('/auth/login', { email, password })
            .done((data) => {
                if (data && data.message) window.location.replace(data.message);
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                if (resStatusCode === 401) {
                    $('#login-email').addClass('is-invalid');
                    $('#login-password').addClass('is-invalid');
                    $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
                } else if (resStatusCode === 422) {
                    $('#login-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                } else {
                    $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
                }
            });
        return false;
    });
    // handle forgot password modal
    $('#login-password-forgot').click((e) => {
        e.preventDefault();
        $('#login-modal')
            .modal('hide')
            .on('hidden.bs.modal', () => {
                $('#forgotpw-modal').modal('show');
                $(this).off('hidden.bs.modal'); // Remove the 'on' event binding
            });
    });
    // forgot password form
    $('#forgotpw-form').submit((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email
        const email = $('#forgotpw-email').val();
        const emailDuplicate = $('#forgotpw-email-d').val();
        // get recaptcha
        const recaptcha = $('#g-recaptcha-response-1').val();
        // get token
        const token = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        // validate recaptcha
        if (!recaptcha) {
            return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: You need to complete the captcha ! </div>');
        }
        // validate email
        if (!email || !emailDuplicate || !validator.isEmail(email) || !validator.isEmail(emailDuplicate)) {
            return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>');
        } else if (email !== emailDuplicate) {
            return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: Email adresses don\'t match ! </div>');
        }
        $.post(`/auth/reset/${token}`, { email, emailDuplicate, recaptcha })
            .done((data) => {
                if (data && data.message) {
                    return $('#forgotpw-form').before(`<div class="alert alert-success" role="alert"> ${data.message} </div>`);
                }
                return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                if (resStatusCode === 400) {
                    $('#forgotpw-email').addClass('is-invalid');
                    $('#forgotpw-email-d').addClass('is-invalid');
                    return $('#forgotpw-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                }
                grecaptcha.reset();
                return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
            });
        return false;
    });
    // handle reset form modal
    // 'resetPw' comes from pug template which comes from express
    // eslint-disable-next-line no-undef
    if (typeof resetPw !== 'undefined' && resetPw) {
        $('#resetpw-modal').modal('show');
    }
    // reset password form
    $('#resetpw-form').submit((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        const password = $('#resetpw-password').val();
        const passwordDuplicate = $('#resetpw-password-d').val();
        const urlParams = window.location.href.split('/');
        const token = urlParams[urlParams.length - 1];
        const email = urlParams[urlParams.length - 2];
        // validate password length (8-30 chars)
        if (password.length < 8 || password.length > 30) {
            return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>');
        }
        // validate passwords
        if (password !== passwordDuplicate) {
            return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Passwords don\'t match ! </div>');
        }
        // validate email
        if (!email || !validator.isEmail(email)) {
            return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>');
        }
        $.post(`/auth/reset/${email}/${token}`, { password, passwordDuplicate })
            .done((data) => {
                if (data && data.message) {
                    return $('#resetpw-form').before(`<div class="alert alert-success" role="alert"> ${data.message} </div>`);
                }
                return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                if (resStatusCode === 400) {
                    $('#resetpw-password').addClass('is-invalid');
                    $('#resetpw-password-d').addClass('is-invalid');
                    return $('#resetpw-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                }
                return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
            });
        return false;
    });
    // handle register modal
    $('#register-modal').on('shown.bs.modal', () => {
        $('#register-email').focus();
    });
    // register form
    $('#register-form').submit((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        const email = $('#register-email').val();
        const password = $('#register-password').val();
        const passwordDuplicate = $('#register-password-d').val();
        const recaptcha = $('#g-recaptcha-response').val();
        // validate recaptcha
        if (!recaptcha) {
            return $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: You need to complete the captcha ! </div>');
        }
        // validate email
        if (!validator.isEmail(email)) {
            return $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email address ! </div>');
        }
        // validate password length (8-30 chars)
        if (password.length < 8 || password.length > 30) {
            return $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>');
        }
        // validate passwords
        if (password !== passwordDuplicate) {
            return $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Passwords don\'t match ! </div>');            
        }
        $.post('/auth/register', { email, password, passwordDuplicate, recaptcha })
            .done((data) => {
                if (data && data.message) window.location.replace(data.message);
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                if (resStatusCode === 401) {
                    $('#register-email').addClass('is-invalid');
                    $('#register-password').addClass('is-invalid');
                    $('#register-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                } else if (resStatusCode === 422) {
                    $('#register-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                } else {
                    $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
                }
                grecaptcha.reset();
            });
        return false;
    });
    // search input
    const tvshows = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/tvshows/search/%QUERY',
            wildcard: '%QUERY',
        },
    });
    $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 3,
    }, {
        name: 'tvshows',
        displayKey: 'seriesName',
        source: tvshows,
        limit: 5,
        templates: {
            suggestion(item) { return `<div data-id=${item.id}> ${item.seriesName} </div>`; },
            notFound(query) { return `<div> '${query.query}' not found </div>`; },
        },
    }).on('typeahead:asyncrequest', () => {
        $('.tt-input').addClass('input-loading');
    }).on('typeahead:asynccancel typeahead:asyncreceive', () => {
        $('.tt-input').removeClass('input-loading');
    });
    // redirect when a tvshow is selected
    // this event returns 3 args (obj, datum, name)
    $('#tvshow-search').bind('typeahead:select', (obj, datum) => {
        window.location.replace(`/tvshows/${datum.id}`);
    });
    // update episodes table when season select changes
    $('#season-select').change(() => {
        const showid = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        const season = $('#season-select :selected').val();
        $.get(`/tvshows/${showid}/episodes`, { season })
            .done((data) => {
                renderEpisodesTable(data.episodes);
            })
            .fail((xhr) => {
                $('#episodes-table').append(`<p> Error requesting season ${season} episodes. Please try again later. </p>`);
            });
        return false;
    });
    // handle add/remove tvshow
    $('#userTvShowState').click(() => {
        const tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        if ($('#userTvShowState').hasClass('btn-primary')) {
            // User is not following this show and wants to add it
            $.get(`/tvshows/${tvshowId}/add`)
                .done((data) => {
                    if (data) {
                        const tvshowName = $('#tvshow-name')[0].innerText;
                        toastr.success(`${tvshowName} added successfully!`);
                        $('#userTvShowState').removeClass('btn-primary').addClass('btn-secondary').html('Remove from my shows');
                    }
                })
                .fail((xhr) => {
                    if (xhr.status === 401 || xhr.status === 403) {
                        toastr.error(xhr.responseJSON.error);
                    } else {
                        toastr.error('Server error. Please try again later.');
                    }
                });
            return false;
        }
        // User is following this show and wants to remove it
        $.get(`/tvshows/${tvshowId}/remove`)
            .done((data) => {
                if (data) {
                    const tvshowName = $('#tvshow-name')[0].innerText;
                    toastr.success(`${tvshowName} removed successfully!`);
                    $('#userTvShowState').removeClass('btn-secondary').addClass('btn-primary').html('Add to my shows');
                }
            })
            .fail((xhr) => {
                if (xhr.status === 401 || xhr.status === 403) {
                    toastr.error(xhr.responseJSON.error);
                } else {
                    toastr.error('Server error. Please try again later.');
                }
            });
        return false;
    });
    // handle submit bug modal
    $('#bug-modal').on('shown.bs.modal', () => {
        $('#bug-email').focus();
    });
    // bug form
    $('#bug-form').submit((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get user id if logged in
        const bugDescription = $('#bug-description').val();
        // validate text
        if (!bugDescription || !sanitize.test(bugDescription)) {
            return $('#bug-form').before('<div class="alert alert-danger" role="alert"> Error: Please fill in the bug description. Only alphanumerical characters! </div>');
        }
        $.post('/bug', { description: bugDescription })
            .done(() => {
                $('#bug-form').before('<div class="alert alert-success" role="alert"> Bug submited successfully. Thanks! </div>');
            })
            .fail(() => {
                $('#bug-form').before('<div class="alert alert-danger" role="alert"> Error: Something went wrong. Please try again. </div>');
            });
        return false;
    });
    // handle messages in cookies
    // For now, this is only used in authentication errors
    // (ie: when a user clicks on "calendar" but isnt logged in)
    const messageFromCookies = Cookies.get('message');
    if (messageFromCookies) {
        toastr.error(messageFromCookies);
        Cookies.remove('message');
    }
});
