(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

$(function () {
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
    $('#tvshow-name').bind('typeahead:select', function (obj, datum) {
        window.location.replace('/tvshows/' + String(datum.id));
    });
    // update episodes table when season select changes
    // make sure this is being cached (select the same 2 seasons multiple times and check network)
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
    function renderEpisodesTable(episodes) {
        var table = $('#episodes-table > tbody');
        table.empty();
        episodes.forEach(function (episode) {
            table.append('<tr> <td>' + String(episode.num) + '</td> <td class="name">' + String(episode.name) + '</td> <td class="airdate">' + String(episode.airdate) + '</td> <td><i class="fa fa-eye" aria-hidden="true"></i></td> </tr>');
        }, this);
    }
    $('#addTvShow').click(function () {
        var tvshowId = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        $.get('/tvshows/' + String(tvshowId) + '/add').done(function (data) {
            console.log(data);
        }).fail(function (xhr) {
            console.log(xhr);
            // check if the user is authenticated (client-side and server-side)
            // check if the status is 500
            // else show generic error
        });
    });
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsRUFBRSxZQUFNO0FBQ0osTUFBRSxjQUFGLEVBQWtCLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFNO0FBQ3pDLFVBQUUsY0FBRixFQUFrQixLQUFsQjtBQUNILEtBRkQ7QUFHQTtBQUNBLE1BQUUsYUFBRixFQUFpQixNQUFqQixDQUF3QixVQUFDLENBQUQsRUFBTztBQUMzQjtBQUNBLFVBQUUsUUFBRixFQUFZLE1BQVo7QUFDQTtBQUNBLFVBQUUsY0FBRjtBQUNBLFlBQU0sV0FBVztBQUNiLG1CQUFPLEVBQUUsY0FBRixFQUFrQixHQUFsQixFQURNO0FBRWIsc0JBQVUsRUFBRSxpQkFBRixFQUFxQixHQUFyQjtBQUZHLFNBQWpCO0FBSUEsVUFBRSxJQUFGLENBQU8sYUFBUCxFQUFzQixRQUF0QixFQUNLLElBREwsQ0FDVSxVQUFDLElBQUQsRUFBVTtBQUNaLGdCQUFJLFFBQVEsS0FBSyxPQUFqQixFQUEwQixPQUFPLFFBQVAsQ0FBZ0IsT0FBaEIsQ0FBd0IsS0FBSyxPQUE3QjtBQUM3QixTQUhMLEVBSUssSUFKTCxDQUlVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsZ0JBQU0sZ0JBQWdCLElBQUksTUFBMUI7QUFDQTtBQUNBLGdCQUFJLGtCQUFrQixHQUF0QixFQUEyQjtBQUN2QixrQkFBRSxjQUFGLEVBQWtCLFFBQWxCLENBQTJCLFlBQTNCO0FBQ0Esa0JBQUUsaUJBQUYsRUFBcUIsUUFBckIsQ0FBOEIsWUFBOUI7QUFDQSxrQkFBRSxhQUFGLEVBQWlCLE1BQWpCLENBQXdCLG1GQUF4QjtBQUNILGFBSkQsTUFJTztBQUNILGtCQUFFLGFBQUYsRUFBaUIsTUFBakIsQ0FBd0IsNkdBQXhCO0FBQ0g7QUFDSixTQWRMO0FBZUgsS0F4QkQ7QUF5QkEsTUFBRSxpQkFBRixFQUFxQixFQUFyQixD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LGFBQVMsbUJBQVQsQ0FBNkIsUUFBN0IsRUFBdUM7QUFDbkMsWUFBTSxRQUFRLEVBQUUseUJBQUYsQ0FBZDtBQUNBLGNBQU0sS0FBTjtBQUNBLGlCQUFTLE9BQVQsQ0FBaUIsVUFBQyxPQUFELEVBQWE7QUFDMUIsa0JBQU0sTUFBTixzQkFBeUIsUUFBUSxHQUFqQyx1Q0FBOEQsUUFBUSxJQUF0RSwwQ0FBdUcsUUFBUSxPQUEvRztBQUNILFNBRkQsRUFFRyxJQUZIO0FBR0g7QUFDRCxNQUFFLFlBQUYsRUFBZ0IsS0FBaEIsQ0FBc0IsWUFBTTtBQUN4QixZQUFNLFdBQVcsT0FBTyxRQUFQLENBQWdCLElBQWhCLENBQXFCLE1BQXJCLENBQTRCLE9BQU8sUUFBUCxDQUFnQixJQUFoQixDQUFxQixXQUFyQixDQUFpQyxHQUFqQyxJQUF3QyxDQUFwRSxDQUFqQjtBQUNBLFVBQUUsR0FBRixzQkFBa0IsUUFBbEIsWUFDSyxJQURMLENBQ1UsVUFBQyxJQUFELEVBQVU7QUFDWixvQkFBUSxHQUFSLENBQVksSUFBWjtBQUNILFNBSEwsRUFJSyxJQUpMLENBSVUsVUFBQyxHQUFELEVBQVM7QUFDWCxvQkFBUSxHQUFSLENBQVksR0FBWjtBQUNBO0FBQ0E7QUFDQTtBQUNILFNBVEw7QUFVSCxLQVpEO0FBYUgsQ0F2SEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuJCgoKSA9PiB7XHJcbiAgICAkKCcjbG9naW4tbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI2xvZ2luLWVtYWlsJykuZm9jdXMoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gbG9naW4gZm9ybVxyXG4gICAgJCgnI2xvZ2luLWZvcm0nKS5zdWJtaXQoKGUpID0+IHtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSB7XHJcbiAgICAgICAgICAgIGVtYWlsOiAkKCcjbG9naW4tZW1haWwnKS52YWwoKSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6ICQoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJC5wb3N0KCcvYXV0aC9sb2dpbicsIGZvcm1EYXRhKVxyXG4gICAgICAgICAgICAuZG9uZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5tZXNzYWdlKSB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoeGhyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNTdGF0dXNDb2RlID0geGhyLnN0YXR1cztcclxuICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIGNvZGUgNDAxID09PSB1bmF1dGhvcml6ZWQgPT09IGludmFsaWQgY3JlZGVudGlhbHNcclxuICAgICAgICAgICAgICAgIGlmIChyZXNTdGF0dXNDb2RlID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZW1haWwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNsb2dpbi1wYXNzd29yZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IEludmFsaWQgY3JlZGVudGlhbHMgISA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IE9vb29wcy4gU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBsZWFzZSB0cnkgYWdhaW4uIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgJCgnI3JlZ2lzdGVyLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgKCkgPT4ge1xyXG4gICAgICAgICQoJyNyZWdpc3Rlci1lbWFpbCcpLmZvY3VzKCk7XHJcbiAgICB9KTtcclxuICAgIC8vIHJlZ2lzdGVyIGZvcm1cclxuICAgICQoJyNyZWdpc3Rlci1mb3JtJykuc3VibWl0KChlKSA9PiB7XHJcbiAgICAgICAgLy8gcmVtb3ZlIHByZXZpb3VzIGFsZXJ0IG1lc3NhZ2VcclxuICAgICAgICAkKCcuYWxlcnQnKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBwcmV2ZW50IGZvcm0gc3VibWl0aW9uXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGZvcm1EYXRhID0ge1xyXG4gICAgICAgICAgICBlbWFpbDogJCgnI3JlZ2lzdGVyLWVtYWlsJykudmFsKCksXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiAkKCcjcmVnaXN0ZXItcGFzc3dvcmQnKS52YWwoKSxcclxuICAgICAgICB9O1xyXG4gICAgICAgICQucG9zdCgnL2F1dGgvcmVnaXN0ZXInLCBmb3JtRGF0YSlcclxuICAgICAgICAgICAgLmRvbmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEubWVzc2FnZSkgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKHhocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzU3RhdHVzQ29kZSA9IHhoci5zdGF0dXM7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzU3RhdHVzQ29kZSA9PT0gNDAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLWVtYWlsJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVnaXN0ZXItcGFzc3dvcmQnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1mb3JtJykuYmVmb3JlKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiBJbnZhbGlkIGNyZWRlbnRpYWxzICEgPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc1N0YXR1c0NvZGUgPT09IDQyMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1mb3JtJykuYmVmb3JlKGA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZGFuZ2VyXCIgcm9sZT1cImFsZXJ0XCI+IEVycm9yOiAke3hoci5yZXNwb25zZUpTT04uZXJyb3J9IDwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgLy8gc2VhcmNoIGlucHV0XHJcbiAgICBjb25zdCB0dnNob3dzID0gbmV3IEJsb29kaG91bmQoe1xyXG4gICAgICAgIGRhdHVtVG9rZW5pemVyOiBCbG9vZGhvdW5kLnRva2VuaXplcnMub2JqLndoaXRlc3BhY2UoJ3ZhbHVlJyksXHJcbiAgICAgICAgcXVlcnlUb2tlbml6ZXI6IEJsb29kaG91bmQudG9rZW5pemVycy53aGl0ZXNwYWNlLFxyXG4gICAgICAgIHJlbW90ZToge1xyXG4gICAgICAgICAgICB1cmw6ICcvdHZzaG93cy9zZWFyY2gvJVFVRVJZJyxcclxuICAgICAgICAgICAgd2lsZGNhcmQ6ICclUVVFUlknLFxyXG4gICAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgICQoJy50eXBlYWhlYWQnKS50eXBlYWhlYWQoe1xyXG4gICAgICAgIGhpbnQ6IHRydWUsXHJcbiAgICAgICAgaGlnaGxpZ2h0OiB0cnVlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMyxcclxuICAgIH0sIHtcclxuICAgICAgICBuYW1lOiAndHZzaG93cycsXHJcbiAgICAgICAgZGlzcGxheUtleTogJ3Nlcmllc05hbWUnLFxyXG4gICAgICAgIHNvdXJjZTogdHZzaG93cyxcclxuICAgICAgICBsaW1pdDogNSxcclxuICAgICAgICB0ZW1wbGF0ZXM6IHtcclxuICAgICAgICAgICAgc3VnZ2VzdGlvbihpdGVtKSB7IHJldHVybiBgPGRpdiBkYXRhLWlkPSR7aXRlbS5pZH0+ICR7aXRlbS5zZXJpZXNOYW1lfSA8L2Rpdj5gOyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgIC8vIHJlZGlyZWN0IHdoZW4gYSB0dnNob3cgaXMgc2VsZWN0ZWRcclxuICAgIC8vIHRoaXMgZXZlbnQgcmV0dXJucyAzIGFyZ3MgKG9iaiwgZGF0dW0sIG5hbWUpXHJcbiAgICAkKCcjdHZzaG93LW5hbWUnKS5iaW5kKCd0eXBlYWhlYWQ6c2VsZWN0JywgKG9iaiwgZGF0dW0pID0+IHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShgL3R2c2hvd3MvJHtkYXR1bS5pZH1gKTtcclxuICAgIH0pO1xyXG4gICAgLy8gdXBkYXRlIGVwaXNvZGVzIHRhYmxlIHdoZW4gc2Vhc29uIHNlbGVjdCBjaGFuZ2VzXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhpcyBpcyBiZWluZyBjYWNoZWQgKHNlbGVjdCB0aGUgc2FtZSAyIHNlYXNvbnMgbXVsdGlwbGUgdGltZXMgYW5kIGNoZWNrIG5ldHdvcmspXHJcbiAgICAkKCcjc2Vhc29uLXNlbGVjdCcpLmNoYW5nZSgoKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2hvd2lkID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcclxuICAgICAgICBjb25zdCBzZWFzb24gPSAkKCcjc2Vhc29uLXNlbGVjdCA6c2VsZWN0ZWQnKS52YWwoKTtcclxuICAgICAgICAkLmdldChgL3R2c2hvd3MvJHtzaG93aWR9L2VwaXNvZGVzYCwgeyBzZWFzb24gfSlcclxuICAgICAgICAgICAgLmRvbmUoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEuZXBpc29kZXMpO1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyRXBpc29kZXNUYWJsZShkYXRhLmVwaXNvZGVzKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKHhocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coeGhyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIGZ1bmN0aW9uIHJlbmRlckVwaXNvZGVzVGFibGUoZXBpc29kZXMpIHtcclxuICAgICAgICBjb25zdCB0YWJsZSA9ICQoJyNlcGlzb2Rlcy10YWJsZSA+IHRib2R5Jyk7XHJcbiAgICAgICAgdGFibGUuZW1wdHkoKTtcclxuICAgICAgICBlcGlzb2Rlcy5mb3JFYWNoKChlcGlzb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIHRhYmxlLmFwcGVuZChgPHRyPiA8dGQ+JHtlcGlzb2RlLm51bX08L3RkPiA8dGQgY2xhc3M9XCJuYW1lXCI+JHtlcGlzb2RlLm5hbWV9PC90ZD4gPHRkIGNsYXNzPVwiYWlyZGF0ZVwiPiR7ZXBpc29kZS5haXJkYXRlfTwvdGQ+IDx0ZD48aSBjbGFzcz1cImZhIGZhLWV5ZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48L3RkPiA8L3RyPmApO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgJCgnI2FkZFR2U2hvdycpLmNsaWNrKCgpID0+IHtcclxuICAgICAgICBjb25zdCB0dnNob3dJZCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cih3aW5kb3cubG9jYXRpb24uaHJlZi5sYXN0SW5kZXhPZignLycpICsgMSk7XHJcbiAgICAgICAgJC5nZXQoYC90dnNob3dzLyR7dHZzaG93SWR9L2FkZGApXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKHhocikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coeGhyKTtcclxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQgKGNsaWVudC1zaWRlIGFuZCBzZXJ2ZXItc2lkZSlcclxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBzdGF0dXMgaXMgNTAwXHJcbiAgICAgICAgICAgICAgICAvLyBlbHNlIHNob3cgZ2VuZXJpYyBlcnJvclxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuIl19
