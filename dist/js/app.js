(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function renderEpisodesTable(episodes) {
    var table = $('#episodes-table > tbody');
    table.empty();
    episodes.forEach(function (episode) {
        table.append('<tr> <td>' + String(episode.num) + '</td> <td class="name">' + String(episode.name) + '</td> <td class="airdate">' + String(episode.airdate) + '</td> <td><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>');
    }, this);
}

var sanitize = new RegExp(/^[\w\-\s.,;:]+$/);

$(function () {
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
        hideMethod: 'fadeOut'
    };
    // handle login modal
    $('#login-modal').on('shown.bs.modal', function () {
        $('#login-email').focus();
    });
    // login form
    $('#login-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        var email = $('#login-email').val();
        var password = $('#login-password').val();
        // validate email
        if (!validator.isEmail(email)) {
            return $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid email ! </div>');
        }
        // validate password length (8-30 chars)
        if (password.length < 8 || password.length > 30) {
            return $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Password must be 8-30 chars ! </div>');
        }
        $.post('/auth/login', { email: email, password: password }).done(function (data) {
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            if (resStatusCode === 401) {
                $('#login-email').addClass('is-invalid');
                $('#login-password').addClass('is-invalid');
                $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
            } else if (resStatusCode === 422) {
                $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
            } else {
                $('#login-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
            }
        });
        return false;
    });
    // handle forgot password modal
    $('#login-password-forgot').click(function (e) {
        e.preventDefault();
        $('#login-modal').modal('hide').on('hidden.bs.modal', function () {
            $('#forgotpw-modal').modal('show');
            $(undefined).off('hidden.bs.modal'); // Remove the 'on' event binding
        });
    });
    // forgot password form
    $('#forgotpw-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email
        var email = $('#forgotpw-email').val();
        var emailDuplicate = $('#forgotpw-email-d').val();
        // get recaptcha
        var recaptcha = $('#g-recaptcha-response-1').val();
        // get token
        var token = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
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
        $.post('/auth/reset/' + String(token), { email: email, emailDuplicate: emailDuplicate, recaptcha: recaptcha }).done(function (data) {
            if (data && data.message) {
                return $('#forgotpw-form').before('<div class="alert alert-success" role="alert"> ' + String(data.message) + ' </div>');
            }
            return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            if (resStatusCode === 400) {
                $('#forgotpw-email').addClass('is-invalid');
                $('#forgotpw-email-d').addClass('is-invalid');
                return $('#forgotpw-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
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
    $('#resetpw-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        var password = $('#resetpw-password').val();
        var passwordDuplicate = $('#resetpw-password-d').val();
        var urlParams = window.location.href.split('/');
        var token = urlParams[urlParams.length - 1];
        var email = urlParams[urlParams.length - 2];
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
        $.post('/auth/reset/' + String(email) + '/' + String(token), { password: password, passwordDuplicate: passwordDuplicate }).done(function (data) {
            if (data && data.message) {
                return $('#resetpw-form').before('<div class="alert alert-success" role="alert"> ' + String(data.message) + ' </div>');
            }
            return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            if (resStatusCode === 400) {
                $('#resetpw-password').addClass('is-invalid');
                $('#resetpw-password-d').addClass('is-invalid');
                return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
            }
            return $('#resetpw-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. </div>');
        });
        return false;
    });
    // handle register modal
    $('#register-modal').on('shown.bs.modal', function () {
        $('#register-email').focus();
    });
    // register form
    $('#register-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get email and password
        var email = $('#register-email').val();
        var password = $('#register-password').val();
        var passwordDuplicate = $('#register-password-d').val();
        var recaptcha = $('#g-recaptcha-response').val();
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
        $.post('/auth/register', { email: email, password: password, passwordDuplicate: passwordDuplicate, recaptcha: recaptcha }).done(function (data) {
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            if (resStatusCode === 401) {
                $('#register-email').addClass('is-invalid');
                $('#register-password').addClass('is-invalid');
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
            } else if (resStatusCode === 422) {
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
            } else {
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
            }
            grecaptcha.reset();
        });
        return false;
    });
    // search input
    var tvshows = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/tvshows/search/%QUERY',
            wildcard: '%QUERY'
        }
    });
    $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 3
    }, {
        name: 'tvshows',
        displayKey: 'seriesName',
        source: tvshows,
        limit: 5,
        templates: {
            suggestion: function () {
                function suggestion(item) {
                    return '<div data-id=' + String(item.id) + '> ' + String(item.seriesName) + ' </div>';
                }

                return suggestion;
            }(),
            notFound: function () {
                function notFound(query) {
                    return '<div> \'' + String(query.query) + '\' not found </div>';
                }

                return notFound;
            }()
        }
    }).on('typeahead:asyncrequest', function () {
        $('.tt-input').addClass('input-loading');
    }).on('typeahead:asynccancel typeahead:asyncreceive', function () {
        $('.tt-input').removeClass('input-loading');
    });
    // redirect when a tvshow is selected
    // this event returns 3 args (obj, datum, name)
    $('#tvshow-search').bind('typeahead:select', function (obj, datum) {
        window.location.replace('/tvshows/' + String(datum.id));
    });
    // update episodes table when season select changes
    $('#season-select').change(function () {
        var showid = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        var season = $('#season-select :selected').val();
        $.get('/tvshows/' + String(showid) + '/episodes', { season: season }).done(function (data) {
            renderEpisodesTable(data.episodes);
        }).fail(function (xhr) {
            $('#episodes-table').append('<p> Error requesting season ' + String(season) + ' episodes. Please try again later. </p>');
        });
        return false;
    });
    // handle add/remove tvshow
    $('#userTvShowState').click(function () {
        var tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        if ($('#userTvShowState').hasClass('btn-primary')) {
            // User is not following this show and wants to add it
            $.get('/tvshows/' + String(tvshowId) + '/add').done(function (data) {
                if (data) {
                    var tvshowName = $('#tvshow-name')[0].innerText;
                    toastr.success(String(tvshowName) + ' added successfully!');
                    $('#userTvShowState').removeClass('btn-primary').addClass('btn-secondary').html('Remove from my shows');
                }
            }).fail(function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    toastr.error(xhr.responseJSON.error);
                } else {
                    toastr.error('Server error. Please try again later.');
                }
            });
            return false;
        }
        // User is following this show and wants to remove it
        $.get('/tvshows/' + String(tvshowId) + '/remove').done(function (data) {
            if (data) {
                var tvshowName = $('#tvshow-name')[0].innerText;
                toastr.success(String(tvshowName) + ' removed successfully!');
                $('#userTvShowState').removeClass('btn-secondary').addClass('btn-primary').html('Add to my shows');
            }
        }).fail(function (xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                toastr.error(xhr.responseJSON.error);
            } else {
                toastr.error('Server error. Please try again later.');
            }
        });
        return false;
    });
    // handle submit bug modal
    $('#bug-modal').on('shown.bs.modal', function () {
        $('#bug-email').focus();
    });
    // bug form
    $('#bug-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        // get user id if logged in
        var bugDescription = $('#bug-description').val();
        // validate text
        if (!bugDescription || !sanitize.test(bugDescription)) {
            return $('#bug-form').before('<div class="alert alert-danger" role="alert"> Error: Please fill in the bug description. Only alphanumerical characters! </div>');
        }
        $.post('/bug', { description: bugDescription }).done(function () {
            $('#bug-form').before('<div class="alert alert-success" role="alert"> Bug submited successfully. Thanks! </div>');
        }).fail(function () {
            $('#bug-form').before('<div class="alert alert-danger" role="alert"> Error: Something went wrong. Please try again. </div>');
        });
        return false;
    });
    // handle messages in cookies
    // For now, this is only used in authentication errors
    // (ie: when a user clicks on "calendar" but isnt logged in)
    var messageFromCookies = Cookies.get('message');
    if (messageFromCookies) {
        toastr.error(messageFromCookies);
        Cookies.remove('message');
    }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsU0FBUyxtQkFBVCxDQUE2QixRQUE3QixFQUF1QztBQUNuQyxRQUFNLFFBQVEsRUFBRSx5QkFBRixDQUFkO0FBQ0EsVUFBTSxLQUFOO0FBQ0EsYUFBUyxPQUFULENBQWlCLFVBQUMsT0FBRCxFQUFhO0FBQzFCLGNBQU0sTUFBTixzQkFBeUIsUUFBUSxHQUFqQyx1Q0FBOEQsUUFBUSxJQUF0RSwwQ0FBdUcsUUFBUSxPQUEvRztBQUNILEtBRkQsRUFFRyxJQUZIO0FBR0g7O0FBRUQsSUFBTSxXQUFXLElBQUksTUFBSixDQUFXLGlCQUFYLENBQWpCOztBQUVBLEVBQUUsWUFBTTtBQUNKO0FBQ0EsV0FBTyxPQUFQLEdBQWlCO0FBQ2IscUJBQWEsSUFEQTtBQUViLHFCQUFhLElBRkE7QUFHYix1QkFBZSxvQkFIRjtBQUliLDJCQUFtQixLQUpOO0FBS2IsaUJBQVMsSUFMSTtBQU1iLHNCQUFjLEtBTkQ7QUFPYixzQkFBYyxNQVBEO0FBUWIsaUJBQVMsTUFSSTtBQVNiLHlCQUFpQixNQVRKO0FBVWIsb0JBQVksT0FWQztBQVdiLG9CQUFZLFFBWEM7QUFZYixvQkFBWSxRQVpDO0FBYWIsb0JBQVk7QUFiQyxLQUFqQjtBQWVBO0FBQ0EsTUFBRSxjQUFGLEVBQWtCLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFNO0FBQ3pDLFVBQUUsY0FBRixFQUFrQixLQUFsQjtBQUNILEtBRkQ7QUFHQTtBQUNBLE1BQUUsYUFBRixFQUFpQixNQUFqQixDQUF3QixVQUFDLENBQUQsRUFBTztBQUMzQjtBQUNBLFVBQUUsUUFBRixFQUFZLE1BQVo7QUFDQTtBQUNBLFVBQUUsY0FBRjtBQUNBO0FBQ0EsWUFBTSxRQUFRLEVBQUUsY0FBRixFQUFrQixHQUFsQixFQUFkO0FBQ0EsWUFBTSxXQUFXLEVBQUUsaUJBQUYs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SDtBQUNELFVBQUUsSUFBRixDQUFPLE1BQVAsRUFBZSxFQUFFLGFBQWEsY0FBZixFQUFmLEVBQ0ssSUFETCxDQUNVLFlBQU07QUFDUixjQUFFLFdBQUYsRUFBZSxNQUFmLENBQXNCLDBGQUF0QjtBQUNILFNBSEwsRUFJSyxJQUpMLENBSVUsWUFBTTtBQUNSLGNBQUUsV0FBRixFQUFlLE1BQWYsQ0FBc0IscUdBQXRCO0FBQ0gsU0FOTDtBQU9BLGVBQU8sS0FBUDtBQUNILEtBbkJEO0FBb0JBO0FBQ0E7QUFDQTtBQUNBLFFBQU0scUJBQXFCLFFBQVEsR0FBUixDQUFZLFNBQVosQ0FBM0I7QUFDQSxRQUFJLGtCQUFKLEVBQXdCO0FBQ3BCLGVBQU8sS0FBUCxDQUFhLGtCQUFiO0FBQ0EsZ0JBQVEsTUFBUixDQUFlLFNBQWY7QUFDSDtBQUNKLENBcFVEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHJlbmRlckVwaXNvZGVzVGFibGUoZXBpc29kZXMpIHtcclxuICAgIGNvbnN0IHRhYmxlID0gJCgnI2VwaXNvZGVzLXRhYmxlID4gdGJvZHknKTtcclxuICAgIHRhYmxlLmVtcHR5KCk7XHJcbiAgICBlcGlzb2Rlcy5mb3JFYWNoKChlcGlzb2RlKSA9PiB7XHJcbiAgICAgICAgdGFibGUuYXBwZW5kKGA8dHI+IDx0ZD4ke2VwaXNvZGUubnVtfTwvdGQ+IDx0ZCBjbGFzcz1cIm5hbWVcIj4ke2VwaXNvZGUubmFtZX08L3RkPiA8dGQgY2xhc3M9XCJhaXJkYXRlXCI+JHtlcGlzb2RlLmFpcmRhdGV9PC90ZD4gPHRkPjxpIGNsYXNzPVwiZmEgZmEtZXllXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjwvdGQ+IDwvdHI+YCk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxuY29uc3Qgc2FuaXRpemUgPSBuZXcgUmVnRXhwKC9eW1xcd1xcLVxccy4sOzpdKyQvKTtcclxuXHJcbiQoKCkgPT4ge1xyXG4gICAgLy8gc2V0LXVwIHRvYXN0ciBvcHRpb25zIChub3RpZmljYXRpb25zKVxyXG4gICAgdG9hc3RyLm9wdGlvbnMgPSB7XHJcbiAgICAgICAgY2xvc2VCdXR0b246IHRydWUsXHJcbiAgICAgICAgbmV3ZXN0T25Ub3A6IHRydWUsXHJcbiAgICAgICAgcG9zaXRpb25DbGFzczogJ3RvYXN0LWJvdHRvbS1yaWdodCcsXHJcbiAgICAgICAgcHJldmVudER1cGxpY2F0ZXM6IGZhbHNlLFxyXG4gICAgICAgIG9uY2xpY2s6IG51bGwsXHJcbiAgICAgICAgc2hvd0R1cmF0aW9uOiAnMzAwJyxcclxuICAgICAgICBoaWRlRHVyYXRpb246ICcxMDAwJyxcclxuICAgICAgICB0aW1lT3V0OiAnNTAwMCcsXHJcbiAgICAgICAgZXh0ZW5kZWRUaW1lT3V0OiAnMTAwMCcsXHJcbiAgICAgICAgc2hvd0Vhc2luZzogJ3N3aW5nJyxcclxuICAgICAgICBoaWRlRWFzaW5nOiAnbGluZWFyJyxcclxuICAgICAgICBzaG93TWV0aG9kOiAnZmFkZUluJyxcclxuICAgICAgICBoaWRlTWV0aG9kOiAnZmFkZU91dCcsXHJcbiAgICB9O1xyXG4gICAgLy8gaGFuZGxlIGxvZ2luIG1vZGFsXHJcbiAgICAkKCcjbG9naW4tbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI2xvZ2luLWVtYWlsJykuZm9jdXMoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gbG9naW4gZm9ybVxyXG4gICAgJCgnI2xvZ2luLWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8gZ2V0IGVtYWlsIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGNvbnN0IGVtYWlsID0gJCgnI2xvZ2luLWVtYWlsJykudmFsKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSAkKCcjbG9naW4tcGFzc3dvcmQnKS52YWwoKTtcclxuICAgICAgICAvLyB2YWxpZGF0ZSBlbWFpbFxyXG4gICAgICAgIGlmICghdmFsaWRhdG9yLmlzRW1haWwoZW1haWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjbG9naW4tZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogSW52YWxpZCBlbWFpbCAhIDwvZGl2PicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB2YWxpZGF0ZSBwYXNzd29yZCBsZW5ndGggKDgtMzAgY2hhcnMpXHJcbiAgICAgICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDggfHwgcGFzc3dvcmQubGVuZ3RoID4gMzApIHtcclxuICAgICAgICAgICAgcmV0dXJuICQoJyNsb2dpbi1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBQYXNzd29yZCBtdXN0IGJlIDgtMzAgY2hhcnMgISA8L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJC5wb3N0KCcvYXV0aC9sb2dpbicsIHsgZW1haWwsIHBhc3N3b3JkIH0pXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc1N0YXR1c0NvZGUgPSB4aHIuc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc1N0YXR1c0NvZGUgPT09IDQwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNsb2dpbi1lbWFpbCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLXBhc3N3b3JkJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogSW52YWxpZCBjcmVkZW50aWFscyAhIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNTdGF0dXNDb2RlID09PSA0MjIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZm9ybScpLmJlZm9yZShgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogJHt4aHIucmVzcG9uc2VKU09OLmVycm9yfSA8L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IE9vb29wcy4gU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBsZWFzZSB0cnkgYWdhaW4uIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIC8vIGhhbmRsZSBmb3Jnb3QgcGFzc3dvcmQgbW9kYWxcclxuICAgICQoJyNsb2dpbi1wYXNzd29yZC1mb3Jnb3QnKS5jbGljaygoZSkgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAkKCcjbG9naW4tbW9kYWwnKVxyXG4gICAgICAgICAgICAubW9kYWwoJ2hpZGUnKVxyXG4gICAgICAgICAgICAub24oJ2hpZGRlbi5icy5tb2RhbCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICQoJyNmb3Jnb3Rwdy1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLm9mZignaGlkZGVuLmJzLm1vZGFsJyk7IC8vIFJlbW92ZSB0aGUgJ29uJyBldmVudCBiaW5kaW5nXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICAvLyBmb3Jnb3QgcGFzc3dvcmQgZm9ybVxyXG4gICAgJCgnI2ZvcmdvdHB3LWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8gZ2V0IGVtYWlsXHJcbiAgICAgICAgY29uc3QgZW1haWwgPSAkKCcjZm9yZ290cHctZW1haWwnKS52YWwoKTtcclxuICAgICAgICBjb25zdCBlbWFpbER1cGxpY2F0ZSA9ICQoJyNmb3Jnb3Rwdy1lbWFpbC1kJykudmFsKCk7XHJcbiAgICAgICAgLy8gZ2V0IHJlY2FwdGNoYVxyXG4gICAgICAgIGNvbnN0IHJlY2FwdGNoYSA9ICQoJyNnLXJlY2FwdGNoYS1yZXNwb25zZS0xJykudmFsKCk7XHJcbiAgICAgICAgLy8gZ2V0IHRva2VuXHJcbiAgICAgICAgY29uc3QgdG9rZW4gPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zdWJzdHIod2luZG93LmxvY2F0aW9uLmhyZWYubGFzdEluZGV4T2YoJy8nKSArIDEpO1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHJlY2FwdGNoYVxyXG4gICAgICAgIGlmICghcmVjYXB0Y2hhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjZm9yZ290cHctZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogWW91IG5lZWQgdG8gY29tcGxldGUgdGhlIGNhcHRjaGEgISA8L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgZW1haWxcclxuICAgICAgICBpZiAoIWVtYWlsIHx8ICFlbWFpbER1cGxpY2F0ZSB8fCAhdmFsaWRhdG9yLmlzRW1haWwoZW1haWwpIHx8ICF2YWxpZGF0b3IuaXNFbWFpbChlbWFpbER1cGxpY2F0ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQoJyNmb3Jnb3Rwdy1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBJbnZhbGlkIGVtYWlsIGFkZHJlc3MgISA8L2Rpdj4nKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGVtYWlsICE9PSBlbWFpbER1cGxpY2F0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJCgnI2ZvcmdvdHB3LWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IEVtYWlsIGFkcmVzc2VzIGRvblxcJ3QgbWF0Y2ggISA8L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJC5wb3N0KGAvYXV0aC9yZXNldC8ke3Rva2VufWAsIHsgZW1haWwsIGVtYWlsRHVwbGljYXRlLCByZWNhcHRjaGEgfSlcclxuICAgICAgICAgICAgLmRvbmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkKCcjZm9yZ290cHctZm9ybScpLmJlZm9yZShgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIiByb2xlPVwiYWxlcnRcIj4gJHtkYXRhLm1lc3NhZ2V9IDwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQoJyNmb3Jnb3Rwdy1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBPb29vcHMuIFNvbWV0aGluZyB3ZW50IHdyb25nLiA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKHhocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzU3RhdHVzQ29kZSA9IHhoci5zdGF0dXM7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzU3RhdHVzQ29kZSA9PT0gNDAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2ZvcmdvdHB3LWVtYWlsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjZm9yZ290cHctZW1haWwtZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQoJyNmb3Jnb3Rwdy1mb3JtJykuYmVmb3JlKGA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiAke3hoci5yZXNwb25zZUpTT04uZXJyb3J9IDwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZ3JlY2FwdGNoYS5yZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQoJyNmb3Jnb3Rwdy1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBPb29vcHMuIFNvbWV0aGluZyB3ZW50IHdyb25nLiA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBoYW5kbGUgcmVzZXQgZm9ybSBtb2RhbFxyXG4gICAgLy8gJ3Jlc2V0UHcnIGNvbWVzIGZyb20gcHVnIHRlbXBsYXRlIHdoaWNoIGNvbWVzIGZyb20gZXhwcmVzc1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXHJcbiAgICBpZiAodHlwZW9mIHJlc2V0UHcgIT09ICd1bmRlZmluZWQnICYmIHJlc2V0UHcpIHtcclxuICAgICAgICAkKCcjcmVzZXRwdy1tb2RhbCcpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICB9XHJcbiAgICAvLyByZXNldCBwYXNzd29yZCBmb3JtXHJcbiAgICAkKCcjcmVzZXRwdy1mb3JtJykuc3VibWl0KChlKSA9PiB7XHJcbiAgICAgICAgLy8gcmVtb3ZlIHByZXZpb3VzIGFsZXJ0IG1lc3NhZ2VcclxuICAgICAgICAkKCcuYWxlcnQnKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBwcmV2ZW50IGZvcm0gc3VibWl0aW9uXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIC8vIGdldCBlbWFpbCBhbmQgcGFzc3dvcmRcclxuICAgICAgICBjb25zdCBwYXNzd29yZCA9ICQoJyNyZXNldHB3LXBhc3N3b3JkJykudmFsKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmREdXBsaWNhdGUgPSAkKCcjcmVzZXRwdy1wYXNzd29yZC1kJykudmFsKCk7XHJcbiAgICAgICAgY29uc3QgdXJsUGFyYW1zID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJy8nKTtcclxuICAgICAgICBjb25zdCB0b2tlbiA9IHVybFBhcmFtc1t1cmxQYXJhbXMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgY29uc3QgZW1haWwgPSB1cmxQYXJhbXNbdXJsUGFyYW1zLmxlbmd0aCAtIDJdO1xyXG4gICAgICAgIC8vIHZhbGlkYXRlIHBhc3N3b3JkIGxlbmd0aCAoOC0zMCBjaGFycylcclxuICAgICAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgOCB8fCBwYXNzd29yZC5sZW5ndGggPiAzMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJCgnI3Jlc2V0cHctZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogUGFzc3dvcmQgbXVzdCBiZSA4LTMwIGNoYXJzICEgPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHZhbGlkYXRlIHBhc3N3b3Jkc1xyXG4gICAgICAgIGlmIChwYXNzd29yZCAhPT0gcGFzc3dvcmREdXBsaWNhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQoJyNyZXNldHB3LWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IFBhc3N3b3JkcyBkb25cXCd0IG1hdGNoICEgPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHZhbGlkYXRlIGVtYWlsXHJcbiAgICAgICAgaWYgKCFlbWFpbCB8fCAhdmFsaWRhdG9yLmlzRW1haWwoZW1haWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjcmVzZXRwdy1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBJbnZhbGlkIGVtYWlsIGFkZHJlc3MgISA8L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJC5wb3N0KGAvYXV0aC9yZXNldC8ke2VtYWlsfS8ke3Rva2VufWAsIHsgcGFzc3dvcmQsIHBhc3N3b3JkRHVwbGljYXRlIH0pXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJCgnI3Jlc2V0cHctZm9ybScpLmJlZm9yZShgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIiByb2xlPVwiYWxlcnRcIj4gJHtkYXRhLm1lc3NhZ2V9IDwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQoJyNyZXNldHB3LWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IE9vb29wcy4gU29tZXRoaW5nIHdlbnQgd3JvbmcuIDwvZGl2PicpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoeGhyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNTdGF0dXNDb2RlID0geGhyLnN0YXR1cztcclxuICAgICAgICAgICAgICAgIGlmIChyZXNTdGF0dXNDb2RlID09PSA0MDApIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVzZXRwdy1wYXNzd29yZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3Jlc2V0cHctcGFzc3dvcmQtZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQoJyNyZXNldHB3LWZvcm0nKS5iZWZvcmUoYDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6ICR7eGhyLnJlc3BvbnNlSlNPTi5lcnJvcn0gPC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJCgnI3Jlc2V0cHctZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogT29vb3BzLiBTb21ldGhpbmcgd2VudCB3cm9uZy4gPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gaGFuZGxlIHJlZ2lzdGVyIG1vZGFsXHJcbiAgICAkKCcjcmVnaXN0ZXItbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI3JlZ2lzdGVyLWVtYWlsJykuZm9jdXMoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gcmVnaXN0ZXIgZm9ybVxyXG4gICAgJCgnI3JlZ2lzdGVyLWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8gZ2V0IGVtYWlsIGFuZCBwYXNzd29yZFxyXG4gICAgICAgIGNvbnN0IGVtYWlsID0gJCgnI3JlZ2lzdGVyLWVtYWlsJykudmFsKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSAkKCcjcmVnaXN0ZXItcGFzc3dvcmQnKS52YWwoKTtcclxuICAgICAgICBjb25zdCBwYXNzd29yZER1cGxpY2F0ZSA9ICQoJyNyZWdpc3Rlci1wYXNzd29yZC1kJykudmFsKCk7XHJcbiAgICAgICAgY29uc3QgcmVjYXB0Y2hhID0gJCgnI2ctcmVjYXB0Y2hhLXJlc3BvbnNlJykudmFsKCk7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVjYXB0Y2hhXHJcbiAgICAgICAgaWYgKCFyZWNhcHRjaGEpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQoJyNyZWdpc3Rlci1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBZb3UgbmVlZCB0byBjb21wbGV0ZSB0aGUgY2FwdGNoYSAhIDwvZGl2PicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB2YWxpZGF0ZSBlbWFpbFxyXG4gICAgICAgIGlmICghdmFsaWRhdG9yLmlzRW1haWwoZW1haWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjcmVnaXN0ZXItZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogSW52YWxpZCBlbWFpbCBhZGRyZXNzICEgPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHZhbGlkYXRlIHBhc3N3b3JkIGxlbmd0aCAoOC0zMCBjaGFycylcclxuICAgICAgICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgOCB8fCBwYXNzd29yZC5sZW5ndGggPiAzMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJCgnI3JlZ2lzdGVyLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IFBhc3N3b3JkIG11c3QgYmUgOC0zMCBjaGFycyAhIDwvZGl2PicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB2YWxpZGF0ZSBwYXNzd29yZHNcclxuICAgICAgICBpZiAocGFzc3dvcmQgIT09IHBhc3N3b3JkRHVwbGljYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjcmVnaXN0ZXItZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogUGFzc3dvcmRzIGRvblxcJ3QgbWF0Y2ggISA8L2Rpdj4nKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgJC5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIHsgZW1haWwsIHBhc3N3b3JkLCBwYXNzd29yZER1cGxpY2F0ZSwgcmVjYXB0Y2hhIH0pXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc1N0YXR1c0NvZGUgPSB4aHIuc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc1N0YXR1c0NvZGUgPT09IDQwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1lbWFpbCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLXBhc3N3b3JkJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVnaXN0ZXItZm9ybScpLmJlZm9yZShgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogJHt4aHIucmVzcG9uc2VKU09OLmVycm9yfSA8L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzU3RhdHVzQ29kZSA9PT0gNDIyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLWZvcm0nKS5iZWZvcmUoYDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6ICR7eGhyLnJlc3BvbnNlSlNPTi5lcnJvcn0gPC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBPb29vcHMuIFNvbWV0aGluZyB3ZW50IHdyb25nLiBQbGVhc2UgdHJ5IGFnYWluLiA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGdyZWNhcHRjaGEucmVzZXQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBzZWFyY2ggaW5wdXRcclxuICAgIGNvbnN0IHR2c2hvd3MgPSBuZXcgQmxvb2Rob3VuZCh7XHJcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgndmFsdWUnKSxcclxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHVybDogJy90dnNob3dzL3NlYXJjaC8lUVVFUlknLFxyXG4gICAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgJCgnLnR5cGVhaGVhZCcpLnR5cGVhaGVhZCh7XHJcbiAgICAgICAgaGludDogdHJ1ZSxcclxuICAgICAgICBoaWdobGlnaHQ6IHRydWUsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAzLFxyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICd0dnNob3dzJyxcclxuICAgICAgICBkaXNwbGF5S2V5OiAnc2VyaWVzTmFtZScsXHJcbiAgICAgICAgc291cmNlOiB0dnNob3dzLFxyXG4gICAgICAgIGxpbWl0OiA1LFxyXG4gICAgICAgIHRlbXBsYXRlczoge1xyXG4gICAgICAgICAgICBzdWdnZXN0aW9uKGl0ZW0pIHsgcmV0dXJuIGA8ZGl2IGRhdGEtaWQ9JHtpdGVtLmlkfT4gJHtpdGVtLnNlcmllc05hbWV9IDwvZGl2PmA7IH0sXHJcbiAgICAgICAgICAgIG5vdEZvdW5kKHF1ZXJ5KSB7IHJldHVybiBgPGRpdj4gJyR7cXVlcnkucXVlcnl9JyBub3QgZm91bmQgPC9kaXY+YDsgfSxcclxuICAgICAgICB9LFxyXG4gICAgfSkub24oJ3R5cGVhaGVhZDphc3luY3JlcXVlc3QnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnLnR0LWlucHV0JykuYWRkQ2xhc3MoJ2lucHV0LWxvYWRpbmcnKTtcclxuICAgIH0pLm9uKCd0eXBlYWhlYWQ6YXN5bmNjYW5jZWwgdHlwZWFoZWFkOmFzeW5jcmVjZWl2ZScsICgpID0+IHtcclxuICAgICAgICAkKCcudHQtaW5wdXQnKS5yZW1vdmVDbGFzcygnaW5wdXQtbG9hZGluZycpO1xyXG4gICAgfSk7XHJcbiAgICAvLyByZWRpcmVjdCB3aGVuIGEgdHZzaG93IGlzIHNlbGVjdGVkXHJcbiAgICAvLyB0aGlzIGV2ZW50IHJldHVybnMgMyBhcmdzIChvYmosIGRhdHVtLCBuYW1lKVxyXG4gICAgJCgnI3R2c2hvdy1zZWFyY2gnKS5iaW5kKCd0eXBlYWhlYWQ6c2VsZWN0JywgKG9iaiwgZGF0dW0pID0+IHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShgL3R2c2hvd3MvJHtkYXR1bS5pZH1gKTtcclxuICAgIH0pO1xyXG4gICAgLy8gdXBkYXRlIGVwaXNvZGVzIHRhYmxlIHdoZW4gc2Vhc29uIHNlbGVjdCBjaGFuZ2VzXHJcbiAgICAkKCcjc2Vhc29uLXNlbGVjdCcpLmNoYW5nZSgoKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2hvd2lkID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcclxuICAgICAgICBjb25zdCBzZWFzb24gPSAkKCcjc2Vhc29uLXNlbGVjdCA6c2VsZWN0ZWQnKS52YWwoKTtcclxuICAgICAgICAkLmdldChgL3R2c2hvd3MvJHtzaG93aWR9L2VwaXNvZGVzYCwgeyBzZWFzb24gfSlcclxuICAgICAgICAgICAgLmRvbmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlbmRlckVwaXNvZGVzVGFibGUoZGF0YS5lcGlzb2Rlcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgICQoJyNlcGlzb2Rlcy10YWJsZScpLmFwcGVuZChgPHA+IEVycm9yIHJlcXVlc3Rpbmcgc2Vhc29uICR7c2Vhc29ufSBlcGlzb2Rlcy4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4gPC9wPmApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIC8vIGhhbmRsZSBhZGQvcmVtb3ZlIHR2c2hvd1xyXG4gICAgJCgnI3VzZXJUdlNob3dTdGF0ZScpLmNsaWNrKCgpID0+IHtcclxuICAgICAgICBjb25zdCB0dnNob3dJZCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cih3aW5kb3cubG9jYXRpb24uaHJlZi5sYXN0SW5kZXhPZignLycpICsgMSk7XHJcbiAgICAgICAgaWYgKCQoJyN1c2VyVHZTaG93U3RhdGUnKS5oYXNDbGFzcygnYnRuLXByaW1hcnknKSkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIGlzIG5vdCBmb2xsb3dpbmcgdGhpcyBzaG93IGFuZCB3YW50cyB0byBhZGQgaXRcclxuICAgICAgICAgICAgJC5nZXQoYC90dnNob3dzLyR7dHZzaG93SWR9L2FkZGApXHJcbiAgICAgICAgICAgICAgICAuZG9uZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHR2c2hvd05hbWUgPSAkKCcjdHZzaG93LW5hbWUnKVswXS5pbm5lclRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKGAke3R2c2hvd05hbWV9IGFkZGVkIHN1Y2Nlc3NmdWxseSFgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3VzZXJUdlNob3dTdGF0ZScpLnJlbW92ZUNsYXNzKCdidG4tcHJpbWFyeScpLmFkZENsYXNzKCdidG4tc2Vjb25kYXJ5JykuaHRtbCgnUmVtb3ZlIGZyb20gbXkgc2hvd3MnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmZhaWwoKHhocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSA0MDEgfHwgeGhyLnN0YXR1cyA9PT0gNDAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvYXN0ci5lcnJvcih4aHIucmVzcG9uc2VKU09OLmVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2FzdHIuZXJyb3IoJ1NlcnZlciBlcnJvci4gUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBVc2VyIGlzIGZvbGxvd2luZyB0aGlzIHNob3cgYW5kIHdhbnRzIHRvIHJlbW92ZSBpdFxyXG4gICAgICAgICQuZ2V0KGAvdHZzaG93cy8ke3R2c2hvd0lkfS9yZW1vdmVgKVxyXG4gICAgICAgICAgICAuZG9uZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0dnNob3dOYW1lID0gJCgnI3R2c2hvdy1uYW1lJylbMF0uaW5uZXJUZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIHRvYXN0ci5zdWNjZXNzKGAke3R2c2hvd05hbWV9IHJlbW92ZWQgc3VjY2Vzc2Z1bGx5IWApO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyN1c2VyVHZTaG93U3RhdGUnKS5yZW1vdmVDbGFzcygnYnRuLXNlY29uZGFyeScpLmFkZENsYXNzKCdidG4tcHJpbWFyeScpLmh0bWwoJ0FkZCB0byBteSBzaG93cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoeGhyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDAxIHx8IHhoci5zdGF0dXMgPT09IDQwMykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRvYXN0ci5lcnJvcih4aHIucmVzcG9uc2VKU09OLmVycm9yKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9hc3RyLmVycm9yKCdTZXJ2ZXIgZXJyb3IuIFBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gaGFuZGxlIHN1Ym1pdCBidWcgbW9kYWxcclxuICAgICQoJyNidWctbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI2J1Zy1lbWFpbCcpLmZvY3VzKCk7XHJcbiAgICB9KTtcclxuICAgIC8vIGJ1ZyBmb3JtXHJcbiAgICAkKCcjYnVnLWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8gZ2V0IHVzZXIgaWQgaWYgbG9nZ2VkIGluXHJcbiAgICAgICAgY29uc3QgYnVnRGVzY3JpcHRpb24gPSAkKCcjYnVnLWRlc2NyaXB0aW9uJykudmFsKCk7XHJcbiAgICAgICAgLy8gdmFsaWRhdGUgdGV4dFxyXG4gICAgICAgIGlmICghYnVnRGVzY3JpcHRpb24gfHwgIXNhbml0aXplLnRlc3QoYnVnRGVzY3JpcHRpb24pKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkKCcjYnVnLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IFBsZWFzZSBmaWxsIGluIHRoZSBidWcgZGVzY3JpcHRpb24uIE9ubHkgYWxwaGFudW1lcmljYWwgY2hhcmFjdGVycyEgPC9kaXY+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQucG9zdCgnL2J1ZycsIHsgZGVzY3JpcHRpb246IGJ1Z0Rlc2NyaXB0aW9uIH0pXHJcbiAgICAgICAgICAgIC5kb25lKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICQoJyNidWctZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LXN1Y2Nlc3NcIiByb2xlPVwiYWxlcnRcIj4gQnVnIHN1Ym1pdGVkIHN1Y2Nlc3NmdWxseS4gVGhhbmtzISA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgJCgnI2J1Zy1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGxlYXNlIHRyeSBhZ2Fpbi4gPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgLy8gaGFuZGxlIG1lc3NhZ2VzIGluIGNvb2tpZXNcclxuICAgIC8vIEZvciBub3csIHRoaXMgaXMgb25seSB1c2VkIGluIGF1dGhlbnRpY2F0aW9uIGVycm9yc1xyXG4gICAgLy8gKGllOiB3aGVuIGEgdXNlciBjbGlja3Mgb24gXCJjYWxlbmRhclwiIGJ1dCBpc250IGxvZ2dlZCBpbilcclxuICAgIGNvbnN0IG1lc3NhZ2VGcm9tQ29va2llcyA9IENvb2tpZXMuZ2V0KCdtZXNzYWdlJyk7XHJcbiAgICBpZiAobWVzc2FnZUZyb21Db29raWVzKSB7XHJcbiAgICAgICAgdG9hc3RyLmVycm9yKG1lc3NhZ2VGcm9tQ29va2llcyk7XHJcbiAgICAgICAgQ29va2llcy5yZW1vdmUoJ21lc3NhZ2UnKTtcclxuICAgIH1cclxufSk7XHJcbiJdfQ==
