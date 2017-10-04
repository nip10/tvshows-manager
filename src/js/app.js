'use strict';

$(() => {
    $('#login-modal').on('shown.bs.modal', () => {
        $('#login-email').focus();
        console.log('Im here 1');
    });
    // login form
    $('#login-submit').click((e) => {
        console.log('Im here 2');
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
                console.log(data);
                if (data && data.message) window.location.replace(data.message);
            })
            .fail((xhr) => {
                console.log(xhr);
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
});
