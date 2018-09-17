
// Adds datetime filters to req.filters.datetime
function withDateFilters(req, res, next) {
  const query = {
    datetime: {}
  };

  if (req.query.minDate) query.datetime.$gte = new Date(req.query.minDate);
  if (req.query.maxDate) query.datetime.$lt = new Date(req.query.maxDate);

  if (req.query.minDate && req.query.maxDate && new Date(req.query.minDate) > new Date(req.query.maxDate)) {
    return res.sendStatus(422);
  }

  if (req.filters) req.filters.datetime = query;
  else req.filters = { datetime: query };

  next();
}

module.exports = { withDateFilters: withDateFilters };
