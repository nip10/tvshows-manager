'use strict';

$(() => {
    $('#login-modal').on('shown.bs.modal', () => {
        $('#login-email').focus();
    });
    // login form
    $('#login-submit').click((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        const formData = {
            email: $('#login-email').val(),
            password: $('#login-password').val(),
        };
        $.post('/auth/login', formData)
            .done((data) => {
                if (data && data.message) window.location.replace(data.message);
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                // response code 401 === unauthorized === invalid credentials
                if (resStatusCode === 401) {
                    $('#login-email').addClass('is-invalid');
                    $('#login-password').addClass('is-invalid');
                    $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
                } else {
                    $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
                }
            });
    });
    $('#register-modal').on('shown.bs.modal', () => {
        $('#register-email').focus();
    });
    // register form
    $('#register-submit').click((e) => {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        const formData = {
            email: $('#register-email').val(),
            password: $('#register-password').val(),
        };
        $.post('/auth/register', formData)
            .done((data) => {
                if (data && data.message) window.location.replace(data.message);
            })
            .fail((xhr) => {
                const resStatusCode = xhr.status;
                if (resStatusCode === 401) {
                    $('#register-email').addClass('is-invalid');
                    $('#register-password').addClass('is-invalid');
                    $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
                } else if (resStatusCode === 422) {
                    $('#register-form').before(`<div class="alert alert-danger" role="alert"> Error: ${xhr.responseJSON.error} </div>`);
                }
            });
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
        },
    });
    // return 3 args (obj, datum, name)
    $('#tvshow-name').bind('typeahead:select', (obj, datum, name) => {
        console.log(obj);
        console.log(datum.id);
        console.log(name);
        window.location.replace(`/tvshows/${datum.id}`);
    });
});
