(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function renderEpisodesTable(episodes) {
    var table = $('#episodes-table > tbody');
    table.empty();
    episodes.forEach(function (episode) {
        table.append('<tr> <td>' + String(episode.num) + '</td> <td class="name">' + String(episode.name) + '</td> <td class="airdate">' + String(episode.airdate) + '</td> <td><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>');
    }, this);
}

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
    $('#login-modal').on('shown.bs.modal', function () {
        $('#login-email').focus();
    });
    // login form
    $('#login-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        var formData = {
            email: $('#login-email').val(),
            password: $('#login-password').val()
        };
        $.post('/auth/login', formData).done(function (data) {
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
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
    $('#register-modal').on('shown.bs.modal', function () {
        $('#register-email').focus();
    });
    // register form
    $('#register-form').submit(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        var formData = {
            email: $('#register-email').val(),
            password: $('#register-password').val()
        };
        $.post('/auth/register', formData).done(function (data) {
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            if (resStatusCode === 401) {
                $('#register-email').addClass('is-invalid');
                $('#register-password').addClass('is-invalid');
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
            } else if (resStatusCode === 422) {
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: ' + String(xhr.responseJSON.error) + ' </div>');
            }
        });
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
            }()
        }
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
            console.log(data.episodes);
            renderEpisodesTable(data.episodes);
        }).fail(function (xhr) {
            console.log(xhr);
        });
    });
    $('#userTvShowState').click(function () {
        var tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        if ($('#userTvShowState').hasClass('btn-primary')) {
            // User is not following this show and wants to add it
            $.get('/tvshows/' + String(tvshowId) + '/add').done(function (data) {
                if (data) {
                    var tvShowName = $('#tvshow-name')[0].innerText;
                    toastr.success(String(tvShowName) + ' added successfully!');
                    $('#userTvShowState').removeClass('btn-primary').addClass('btn-secondary').html('Remove from my shows');
                }
            }).fail(function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    toastr.error(xhr.responseJSON.error);
                } else {
                    toastr.error('Server error. Please try again later.');
                }
            });
        } else {
            // User is following this show and wants to remove it
            $.get('/tvshows/' + String(tvshowId) + '/remove').done(function (data) {
                if (data) {
                    var tvShowName = $('#tvshow-name')[0].innerText;
                    toastr.success(String(tvShowName) + ' removed successfully!');
                    $('#userTvShowState').removeClass('btn-secondary').addClass('btn-primary').html('Add to my shows');
                }
            }).fail(function (xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    toastr.error(xhr.responseJSON.error);
                } else {
                    toastr.error('Server error. Please try again later.');
                }
            });
        }
    });
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsU0FBUyxtQkFBVCxDQUE2QixRQUE3QixFQUF1QztBQUNuQyxRQUFNLFFBQVEsRUFBRSx5QkFBRixDQUFkO0FBQ0EsVUFBTSxLQUFOO0FBQ0EsYUFBUyxPQUFULENBQWlCLFVBQUMsT0FBRCxFQUFhO0FBQzFCLGNBQU0sTUFBTixzQkFBeUIsUUFBUSxHQUFqQyx1Q0FBOEQsUUFBUSxJQUF0RSwwQ0FBdUcsUUFBUSxPQUEvRztBQUNILEtBRkQsRUFFRyxJQUZIO0FBR0g7O0FBRUQsRUFBRSxZQUFNO0FBQ0o7QUFDQSxXQUFPLE9BQVAsR0FBaUI7QUFDYixxQkFBYSxJQURBO0FBRWIscUJBQWEsSUFGQTtBQUdiLHVCQUFlLG9CQUhGO0FBSWIsMkJBQW1CLEtBSk47QUFLYixpQkFBUyxJQUxJO0FBTWIsc0JBQWMsS0FORDtBQU9iLHNCQUFjLE1BUEQ7QUFRYixpQkFBUyxNQVJJO0FBU2IseUJBQWlCLE1BVEo7QUFVYixvQkFBWSxPQVZDO0FBV2Isb0JBQVksUUFYQztBQVliLG9CQUFZLFFBWkM7QUFhYixvQkFBWTtBQWJDLEtBQWpCO0FBZUEsTUFBRSxjQUFGLEVBQWtCLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFNO0FBQ3pDLFVBQUUsY0FBRixFQUFrQixLQUFsQjtBQUNILEtBRkQ7QUFHQTtBQUNBLE1BQUUsYUFBRixFQUFpQixNQUFqQixDQUF3QixVQUFDLENBQUQsRUFBTztBQUMzQjtBQUNBLFVBQUUsUUFBRixFQUFZLE1BQVo7QUFDQTtBQUNBLFVBQUUsY0FBRjtBQUNBLFlBQU0sV0FBVztBQUNiLG1CQUFPLEVBQUUsY0FBRixFQUFrQixHQUFsQixFQURNO0FBRWIsc0JBQVUsRUFBRSxpQkFBRixFQUFxQixHQUFyQjtBQUZHLFNBQWpCO0FBSUEsVUFBRSxJQUFGLENBQU8sYUFB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M0UsQ0FBZ0Ysc0JBQWhGO0FBQ0g7QUFDSixhQVBMLEVBUUssSUFSTCxDQVFVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsb0JBQUksSUFBSSxNQUFKLEtBQWUsR0FBZixJQUFzQixJQUFJLE1BQUosS0FBZSxHQUF6QyxFQUE4QztBQUMxQywyQkFBTyxLQUFQLENBQWEsSUFBSSxZQUFKLENBQWlCLEtBQTlCO0FBQ0gsaUJBRkQsTUFFTztBQUNILDJCQUFPLEtBQVAsQ0FBYSx1Q0FBYjtBQUNIO0FBQ0osYUFkTDtBQWVILFNBakJELE1BaUJPO0FBQ0g7QUFDQSxjQUFFLEdBQUYsc0JBQWtCLFFBQWxCLGVBQ0ssSUFETCxDQUNVLFVBQUMsSUFBRCxFQUFVO0FBQ1osb0JBQUksSUFBSixFQUFVO0FBQ04sd0JBQU0sYUFBYSxFQUFFLGNBQUYsRUFBa0IsQ0FBbEIsRUFBcUIsU0FBeEM7QUFDQSwyQkFBTyxPQUFQLFFBQWtCLFVBQWxCO0FBQ0Esc0JBQUUsa0JBQUYsRUFBc0IsV0FBdEIsQ0FBa0MsZUFBbEMsRUFBbUQsUUFBbkQsQ0FBNEQsYUFBNUQsRUFBMkUsSUFBM0UsQ0FBZ0YsaUJBQWhGO0FBQ0g7QUFDSixhQVBMLEVBUUssSUFSTCxDQVFVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsb0JBQUksSUFBSSxNQUFKLEtBQWUsR0FBZixJQUFzQixJQUFJLE1BQUosS0FBZSxHQUF6QyxFQUE4QztBQUMxQywyQkFBTyxLQUFQLENBQWEsSUFBSSxZQUFKLENBQWlCLEtBQTlCO0FBQ0gsaUJBRkQsTUFFTztBQUNILDJCQUFPLEtBQVAsQ0FBYSx1Q0FBYjtBQUNIO0FBQ0osYUFkTDtBQWVIO0FBQ0osS0FyQ0Q7QUFzQ0gsQ0F4SkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyRXBpc29kZXNUYWJsZShlcGlzb2Rlcykge1xyXG4gICAgY29uc3QgdGFibGUgPSAkKCcjZXBpc29kZXMtdGFibGUgPiB0Ym9keScpO1xyXG4gICAgdGFibGUuZW1wdHkoKTtcclxuICAgIGVwaXNvZGVzLmZvckVhY2goKGVwaXNvZGUpID0+IHtcclxuICAgICAgICB0YWJsZS5hcHBlbmQoYDx0cj4gPHRkPiR7ZXBpc29kZS5udW19PC90ZD4gPHRkIGNsYXNzPVwibmFtZVwiPiR7ZXBpc29kZS5uYW1lfTwvdGQ+IDx0ZCBjbGFzcz1cImFpcmRhdGVcIj4ke2VwaXNvZGUuYWlyZGF0ZX08L3RkPiA8dGQ+PGkgY2xhc3M9XCJmYSBmYS1leWVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PC90ZD4gPC90cj5gKTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG4kKCgpID0+IHtcclxuICAgIC8vIHNldC11cCB0b2FzdHIgb3B0aW9ucyAobm90aWZpY2F0aW9ucylcclxuICAgIHRvYXN0ci5vcHRpb25zID0ge1xyXG4gICAgICAgIGNsb3NlQnV0dG9uOiB0cnVlLFxyXG4gICAgICAgIG5ld2VzdE9uVG9wOiB0cnVlLFxyXG4gICAgICAgIHBvc2l0aW9uQ2xhc3M6ICd0b2FzdC1ib3R0b20tcmlnaHQnLFxyXG4gICAgICAgIHByZXZlbnREdXBsaWNhdGVzOiBmYWxzZSxcclxuICAgICAgICBvbmNsaWNrOiBudWxsLFxyXG4gICAgICAgIHNob3dEdXJhdGlvbjogJzMwMCcsXHJcbiAgICAgICAgaGlkZUR1cmF0aW9uOiAnMTAwMCcsXHJcbiAgICAgICAgdGltZU91dDogJzUwMDAnLFxyXG4gICAgICAgIGV4dGVuZGVkVGltZU91dDogJzEwMDAnLFxyXG4gICAgICAgIHNob3dFYXNpbmc6ICdzd2luZycsXHJcbiAgICAgICAgaGlkZUVhc2luZzogJ2xpbmVhcicsXHJcbiAgICAgICAgc2hvd01ldGhvZDogJ2ZhZGVJbicsXHJcbiAgICAgICAgaGlkZU1ldGhvZDogJ2ZhZGVPdXQnLFxyXG4gICAgfTtcclxuICAgICQoJyNsb2dpbi1tb2RhbCcpLm9uKCdzaG93bi5icy5tb2RhbCcsICgpID0+IHtcclxuICAgICAgICAkKCcjbG9naW4tZW1haWwnKS5mb2N1cygpO1xyXG4gICAgfSk7XHJcbiAgICAvLyBsb2dpbiBmb3JtXHJcbiAgICAkKCcjbG9naW4tZm9ybScpLnN1Ym1pdCgoZSkgPT4ge1xyXG4gICAgICAgIC8vIHJlbW92ZSBwcmV2aW91cyBhbGVydCBtZXNzYWdlXHJcbiAgICAgICAgJCgnLmFsZXJ0JykucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gcHJldmVudCBmb3JtIHN1Ym1pdGlvblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IHtcclxuICAgICAgICAgICAgZW1haWw6ICQoJyNsb2dpbi1lbWFpbCcpLnZhbCgpLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogJCgnI2xvZ2luLXBhc3N3b3JkJykudmFsKCksXHJcbiAgICAgICAgfTtcclxuICAgICAgICAkLnBvc3QoJy9hdXRoL2xvZ2luJywgZm9ybURhdGEpXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc1N0YXR1c0NvZGUgPSB4aHIuc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVzcG9uc2UgY29kZSA0MDEgPT09IHVuYXV0aG9yaXplZCA9PT0gaW52YWxpZCBjcmVkZW50aWFsc1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc1N0YXR1c0NvZGUgPT09IDQwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNsb2dpbi1lbWFpbCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLXBhc3N3b3JkJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogSW52YWxpZCBjcmVkZW50aWFscyAhIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogT29vb3BzLiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGxlYXNlIHRyeSBhZ2Fpbi4gPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICAkKCcjcmVnaXN0ZXItbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI3JlZ2lzdGVyLWVtYWlsJykuZm9jdXMoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gcmVnaXN0ZXIgZm9ybVxyXG4gICAgJCgnI3JlZ2lzdGVyLWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSB7XHJcbiAgICAgICAgICAgIGVtYWlsOiAkKCcjcmVnaXN0ZXItZW1haWwnKS52YWwoKSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6ICQoJyNyZWdpc3Rlci1wYXNzd29yZCcpLnZhbCgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJC5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIGZvcm1EYXRhKVxyXG4gICAgICAgICAgICAuZG9uZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5tZXNzYWdlKSB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoeGhyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNTdGF0dXNDb2RlID0geGhyLnN0YXR1cztcclxuICAgICAgICAgICAgICAgIGlmIChyZXNTdGF0dXNDb2RlID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVnaXN0ZXItZW1haWwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1wYXNzd29yZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IEludmFsaWQgY3JlZGVudGlhbHMgISA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzU3RhdHVzQ29kZSA9PT0gNDIyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLWZvcm0nKS5iZWZvcmUoYDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6ICR7eGhyLnJlc3BvbnNlSlNPTi5lcnJvcn0gPC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICAvLyBzZWFyY2ggaW5wdXRcclxuICAgIGNvbnN0IHR2c2hvd3MgPSBuZXcgQmxvb2Rob3VuZCh7XHJcbiAgICAgICAgZGF0dW1Ub2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy5vYmoud2hpdGVzcGFjZSgndmFsdWUnKSxcclxuICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHVybDogJy90dnNob3dzL3NlYXJjaC8lUVVFUlknLFxyXG4gICAgICAgICAgICB3aWxkY2FyZDogJyVRVUVSWScsXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgJCgnLnR5cGVhaGVhZCcpLnR5cGVhaGVhZCh7XHJcbiAgICAgICAgaGludDogdHJ1ZSxcclxuICAgICAgICBoaWdobGlnaHQ6IHRydWUsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAzLFxyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICd0dnNob3dzJyxcclxuICAgICAgICBkaXNwbGF5S2V5OiAnc2VyaWVzTmFtZScsXHJcbiAgICAgICAgc291cmNlOiB0dnNob3dzLFxyXG4gICAgICAgIGxpbWl0OiA1LFxyXG4gICAgICAgIHRlbXBsYXRlczoge1xyXG4gICAgICAgICAgICBzdWdnZXN0aW9uKGl0ZW0pIHsgcmV0dXJuIGA8ZGl2IGRhdGEtaWQ9JHtpdGVtLmlkfT4gJHtpdGVtLnNlcmllc05hbWV9IDwvZGl2PmA7IH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgLy8gcmVkaXJlY3Qgd2hlbiBhIHR2c2hvdyBpcyBzZWxlY3RlZFxyXG4gICAgLy8gdGhpcyBldmVudCByZXR1cm5zIDMgYXJncyAob2JqLCBkYXR1bSwgbmFtZSlcclxuICAgICQoJyN0dnNob3ctc2VhcmNoJykuYmluZCgndHlwZWFoZWFkOnNlbGVjdCcsIChvYmosIGRhdHVtKSA9PiB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoYC90dnNob3dzLyR7ZGF0dW0uaWR9YCk7XHJcbiAgICB9KTtcclxuICAgIC8vIHVwZGF0ZSBlcGlzb2RlcyB0YWJsZSB3aGVuIHNlYXNvbiBzZWxlY3QgY2hhbmdlc1xyXG4gICAgJCgnI3NlYXNvbi1zZWxlY3QnKS5jaGFuZ2UoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNob3dpZCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cih3aW5kb3cubG9jYXRpb24uaHJlZi5sYXN0SW5kZXhPZignLycpICsgMSk7XHJcbiAgICAgICAgY29uc3Qgc2Vhc29uID0gJCgnI3NlYXNvbi1zZWxlY3QgOnNlbGVjdGVkJykudmFsKCk7XHJcbiAgICAgICAgJC5nZXQoYC90dnNob3dzLyR7c2hvd2lkfS9lcGlzb2Rlc2AsIHsgc2Vhc29uIH0pXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmVwaXNvZGVzKTtcclxuICAgICAgICAgICAgICAgIHJlbmRlckVwaXNvZGVzVGFibGUoZGF0YS5lcGlzb2Rlcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHhocik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICAkKCcjdXNlclR2U2hvd1N0YXRlJykuY2xpY2soKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHR2c2hvd0lkID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcclxuICAgICAgICBpZiAoJCgnI3VzZXJUdlNob3dTdGF0ZScpLmhhc0NsYXNzKCdidG4tcHJpbWFyeScpKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgaXMgbm90IGZvbGxvd2luZyB0aGlzIHNob3cgYW5kIHdhbnRzIHRvIGFkZCBpdFxyXG4gICAgICAgICAgICAkLmdldChgL3R2c2hvd3MvJHt0dnNob3dJZH0vYWRkYClcclxuICAgICAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdHZTaG93TmFtZSA9ICQoJyN0dnNob3ctbmFtZScpWzBdLmlubmVyVGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9hc3RyLnN1Y2Nlc3MoYCR7dHZTaG93TmFtZX0gYWRkZWQgc3VjY2Vzc2Z1bGx5IWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjdXNlclR2U2hvd1N0YXRlJykucmVtb3ZlQ2xhc3MoJ2J0bi1wcmltYXJ5JykuYWRkQ2xhc3MoJ2J0bi1zZWNvbmRhcnknKS5odG1sKCdSZW1vdmUgZnJvbSBteSBzaG93cycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZmFpbCgoeGhyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDQwMSB8fCB4aHIuc3RhdHVzID09PSA0MDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9hc3RyLmVycm9yKHhoci5yZXNwb25zZUpTT04uZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvYXN0ci5lcnJvcignU2VydmVyIGVycm9yLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgaXMgZm9sbG93aW5nIHRoaXMgc2hvdyBhbmQgd2FudHMgdG8gcmVtb3ZlIGl0XHJcbiAgICAgICAgICAgICQuZ2V0KGAvdHZzaG93cy8ke3R2c2hvd0lkfS9yZW1vdmVgKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0dlNob3dOYW1lID0gJCgnI3R2c2hvdy1uYW1lJylbMF0uaW5uZXJUZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2FzdHIuc3VjY2VzcyhgJHt0dlNob3dOYW1lfSByZW1vdmVkIHN1Y2Nlc3NmdWxseSFgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3VzZXJUdlNob3dTdGF0ZScpLnJlbW92ZUNsYXNzKCdidG4tc2Vjb25kYXJ5JykuYWRkQ2xhc3MoJ2J0bi1wcmltYXJ5JykuaHRtbCgnQWRkIHRvIG15IHNob3dzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDAxIHx8IHhoci5zdGF0dXMgPT09IDQwMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2FzdHIuZXJyb3IoeGhyLnJlc3BvbnNlSlNPTi5lcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9hc3RyLmVycm9yKCdTZXJ2ZXIgZXJyb3IuIFBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0pO1xyXG4iXX0=
