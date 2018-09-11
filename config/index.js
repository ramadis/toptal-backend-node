module.exports = {
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret',
  sendgrid: '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' // Export to env var
};
