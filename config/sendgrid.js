var sgMail = require('@sendgrid/mail');
var secret = require('../config').sendgrid;
sgMail.setApiKey(secret);

module.exports = sgMail;