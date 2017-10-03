(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

$(function () {
    $('#login-modal').on('shown.bs.modal', function () {
        $('#login-email').focus();
        console.log('Im here 1');
    });
    // login form
    $('#login-submit').click(function (e) {
        console.log('Im here 2');
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        var formData = {
            email: $('#login-email').val(),
            password: $('#login-password').val()
        };
        $.post('/auth/login', formData).done(function (data) {
            console.log(data);
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            console.log(xhr);
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
    $('#register-submit').click(function (e) {
        // remove previous alert message
        $('.alert').remove();
        // prevent form submition
        e.preventDefault();
        var formData = {
            email: $('#register-email'),
            password: $('#register-password')
        };
        $.post('/auth/register', formData).done(function (data) {
            if (data && data.message) window.location.replace(data.message);
        }).fail(function (xhr) {
            var resStatusCode = xhr.status;
            // response code 401 === unauthorized === invalid credentials
            if (resStatusCode === 401) {
                $('#register-email').addClass('is-invalid');
                $('#register-password').addClass('is-invalid');
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Invalid credentials ! </div>');
            } else {
                $('#register-form').before('<div class="alert alert-danger" role="alert"> Error: Oooops. Something went wrong. Please try again. </div>');
            }
        });
    });
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc1xcYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsRUFBRSxZQUFNO0FBQ0osTUFBRSxjQUFGLEVBQWtCLEVBQWxCLENBQXFCLGdCQUFyQixFQUF1QyxZQUFNO0FBQ3pDLFVBQUUsY0FBRixFQUFrQixLQUFsQjtBQUNBLGdCQUFRLEdBQVIsQ0FBWSxXQUFaO0FBQ0gsS0FIRDtBQUlBO0FBQ0EsTUFBRSxlQUFGLEVBQW1CLEtBQW5CLENBQXlCLFVBQUMsQ0FBRCxFQUFPO0FBQzVCLGdCQUFRLEdBQVIsQ0FBWSxXQUFaO0FBQ0E7QUFDQSxVQUFFLFFBQUYsRUFBWSxNQUFaO0FBQ0E7QUFDQSxVQUFFLGNBQUY7QUFDQSxZQUFNLFdBQVc7QUFDYixtQkFBTyxFQUFFLGNBQUYsRUFBa0IsR0FBbEIsRUFETTtBQUViLHNCQUFVLEVBQUUsaUJBQUYsRUFBcUIsR0FBckI7QUFGRyxTQUFqQjtBQUlBLFVBQUUsSUFBRixDQUFPLGFBQVAsRUFBc0IsUUFBdEIsRUFDSyxJQURMLENBQ1UsVUFBQyxJQUFELEVBQVU7QUFDWixvQkFBUSxHQUFSLENBQVksSUFBWjtBQUNBLGdCQUFJLFFBQVEsS0FBSyxPQUFqQixFQUEwQixPQUFPLFFBQVAsQ0FBZ0IsT0FBaEIsQ0FBd0IsS0FBSyxPQUE3QjtBQUM3QixTQUpMLEVBS0ssSUFMTCxDQUtVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsb0JBQVEsR0FBUixDQUFZLEdBQVo7QUFDQSxnQkFBTSxnQkFBZ0IsSUFBSSxNQUExQjtBQUNBO0FBQ0EsZ0JBQUksa0JBQWtCLEdBQXRCLEVBQTJCO0FBQ3ZCLGtCQUFFLGNBQUYsRUFBa0IsUUFBbEIsQ0FBMkIsWUFBM0I7QUFDQSxrQkFBRSxpQkFBRixFQUFxQixRQUFyQixDQUE4QixZQUE5QjtBQUNBLGtCQUFFLGFBQUYsRUFBaUIsTUFBakIsQ0FBd0IsbUZBQXhCO0FBQ0gsYUFKRCxNQUlPO0FBQ0gsa0JBQUUsYUFBRixFQUFpQixNQUFqQixDQUF3Qiw2R0FBeEI7QUFDSDtBQUNKLFNBaEJMO0FBaUJILEtBM0JEO0FBNEJBLE1BQUUsaUJBQUYsRUFBcUIsRUFBckIsQ0FBd0IsZ0JBQXhCLEVBQTBDLFlBQU07QUFDNUMsVUFBRSxpQkFBRixFQUFxQixLQUFyQjtBQUNILEtBRkQ7QUFHQTtBQUNBLE1BQUUsa0JBQUYsRUFBc0IsS0FBdEIsQ0FBNEIsVUFBQyxDQUFELEVBQU87QUFDL0I7QUFDQSxVQUFFLFFBQUYsRUFBWSxNQUFaO0FBQ0E7QUFDQSxVQUFFLGNBQUY7QUFDQSxZQUFNLFdBQVc7QUFDYixtQkFBTyxFQUFFLGlCQUFGLENBRE07QUFFYixzQkFBVSxFQUFFLG9CQUFGO0FBRkcsU0FBakI7QUFJQSxVQUFFLElBQUYsQ0FBTyxnQkFBUCxFQUF5QixRQUF6QixFQUNLLElBREwsQ0FDVSxVQUFDLElBQUQsRUFBVTtBQUNaLGdCQUFJLFFBQVEsS0FBSyxPQUFqQixFQUEwQixPQUFPLFFBQVAsQ0FBZ0IsT0FBaEIsQ0FBd0IsS0FBSyxPQUE3QjtBQUM3QixTQUhMLEVBSUssSUFKTCxDQUlVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsZ0JBQU0sZ0JBQWdCLElBQUksTUFBMUI7QUFDQTtBQUNBLGdCQUFJLGtCQUFrQixHQUF0QixFQUEyQjtBQUN2QixrQkFBRSxpQkFBRixFQUFxQixRQUFyQixDQUE4QixZQUE5QjtBQUNBLGtCQUFFLG9CQUFGLEVBQXdCLFFBQXhCLENBQWlDLFlBQWpDO0FBQ0Esa0JBQUUsZ0JBQUYsRUFBb0IsTUFBcEIsQ0FBMkIsbUZBQTNCO0FBQ0gsYUFKRCxNQUlPO0FBQ0gsa0JBQUUsZ0JBQUYsRUFBb0IsTUFBcEIsQ0FBMkIsNkdBQTNCO0FBQ0g7QUFDSixTQWRMO0FBZUgsS0F4QkQ7QUF5QkgsQ0EvREQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuJCgoKSA9PiB7XHJcbiAgICAkKCcjbG9naW4tbW9kYWwnKS5vbignc2hvd24uYnMubW9kYWwnLCAoKSA9PiB7XHJcbiAgICAgICAgJCgnI2xvZ2luLWVtYWlsJykuZm9jdXMoKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnSW0gaGVyZSAxJyk7XHJcbiAgICB9KTtcclxuICAgIC8vIGxvZ2luIGZvcm1cclxuICAgICQoJyNsb2dpbi1zdWJtaXQnKS5jbGljaygoZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbSBoZXJlIDInKTtcclxuICAgICAgICAvLyByZW1vdmUgcHJldmlvdXMgYWxlcnQgbWVzc2FnZVxyXG4gICAgICAgICQoJy5hbGVydCcpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIHByZXZlbnQgZm9ybSBzdWJtaXRpb25cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSB7XHJcbiAgICAgICAgICAgIGVtYWlsOiAkKCcjbG9naW4tZW1haWwnKS52YWwoKSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6ICQoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgJC5wb3N0KCcvYXV0aC9sb2dpbicsIGZvcm1EYXRhKVxyXG4gICAgICAgICAgICAuZG9uZSgoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHhocik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNTdGF0dXNDb2RlID0geGhyLnN0YXR1cztcclxuICAgICAgICAgICAgICAgIC8vIHJlc3BvbnNlIGNvZGUgNDAxID09PSB1bmF1dGhvcml6ZWQgPT09IGludmFsaWQgY3JlZGVudGlhbHNcclxuICAgICAgICAgICAgICAgIGlmIChyZXNTdGF0dXNDb2RlID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjbG9naW4tZW1haWwnKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNsb2dpbi1wYXNzd29yZCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IEludmFsaWQgY3JlZGVudGlhbHMgISA8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvZ2luLWZvcm0nKS5iZWZvcmUoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kYW5nZXJcIiByb2xlPVwiYWxlcnRcIj4gRXJyb3I6IE9vb29wcy4gU29tZXRoaW5nIHdlbnQgd3JvbmcuIFBsZWFzZSB0cnkgYWdhaW4uIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgJCgnI3JlZ2lzdGVyLW1vZGFsJykub24oJ3Nob3duLmJzLm1vZGFsJywgKCkgPT4ge1xyXG4gICAgICAgICQoJyNyZWdpc3Rlci1lbWFpbCcpLmZvY3VzKCk7XHJcbiAgICB9KTtcclxuICAgIC8vIHJlZ2lzdGVyIGZvcm1cclxuICAgICQoJyNyZWdpc3Rlci1zdWJtaXQnKS5jbGljaygoZSkgPT4ge1xyXG4gICAgICAgIC8vIHJlbW92ZSBwcmV2aW91cyBhbGVydCBtZXNzYWdlXHJcbiAgICAgICAgJCgnLmFsZXJ0JykucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gcHJldmVudCBmb3JtIHN1Ym1pdGlvblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBmb3JtRGF0YSA9IHtcclxuICAgICAgICAgICAgZW1haWw6ICQoJyNyZWdpc3Rlci1lbWFpbCcpLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogJCgnI3JlZ2lzdGVyLXBhc3N3b3JkJyksXHJcbiAgICAgICAgfTtcclxuICAgICAgICAkLnBvc3QoJy9hdXRoL3JlZ2lzdGVyJywgZm9ybURhdGEpXHJcbiAgICAgICAgICAgIC5kb25lKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1lc3NhZ2UpIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKCh4aHIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc1N0YXR1c0NvZGUgPSB4aHIuc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVzcG9uc2UgY29kZSA0MDEgPT09IHVuYXV0aG9yaXplZCA9PT0gaW52YWxpZCBjcmVkZW50aWFsc1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc1N0YXR1c0NvZGUgPT09IDQwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWdpc3Rlci1lbWFpbCcpLmFkZENsYXNzKCdpcy1pbnZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlZ2lzdGVyLXBhc3N3b3JkJykuYWRkQ2xhc3MoJ2lzLWludmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVnaXN0ZXItZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogSW52YWxpZCBjcmVkZW50aWFscyAhIDwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjcmVnaXN0ZXItZm9ybScpLmJlZm9yZSgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWRhbmdlclwiIHJvbGU9XCJhbGVydFwiPiBFcnJvcjogT29vb3BzLiBTb21ldGhpbmcgd2VudCB3cm9uZy4gUGxlYXNlIHRyeSBhZ2Fpbi4gPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iXX0=
