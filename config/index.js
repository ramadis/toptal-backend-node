module.exports = {
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret',
  sendgrid: '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', // Export to env var
  API: process.env.API || 'http://localhost:3000/api',
  fbAPP: process.env.FB_ID || '2065928303417233',
  fbSECRET: process.env.FB_SECRET || '0085232ae66ac4f95d53c3cc39c241b1'
};
