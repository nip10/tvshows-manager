'use strict';

const toastrOptions = require('./config/toastr');

toastr.options = toastrOptions;

// Check for message's in cookie (and trigger a toastr)
const messages = {
    success: Cookies.get('message_success'),
    error: Cookies.get('message_error'),
};

if (messages) {
    if (messages.success) {
        toastr.error(messages.success);
        Cookies.remove('message_success');
    }
    if (messages.error) {
        toastr.error(messages.error);
        Cookies.remove('message_error');
    }
}
