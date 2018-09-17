// Adds datetime filters to req.filters.datetime
function withDateFilters(req, res, next) {
  let query = {
    datetime: {},
    hour: {}
  };

  if (req.query.minDate) query.datetime.$gte = new Date(req.query.minDate);
  if (req.query.maxDate) query.datetime.$lt = new Date(req.query.maxDate);
  if (req.query.minTime) query.hour.$gte = Number(req.query.minTime);
  if (req.query.maxTime) query.hour.$lte = Number(req.query.maxTime);

  if (
    req.query.minDate &&
    req.query.maxDate &&
    new Date(req.query.minDate) > new Date(req.query.maxDate)
  ) {
    return res.sendStatus(422);
  }

  const finalQuery =
    Object.getOwnPropertyNames(query).reduce((pv, key) => {
      const hasFilters = Object.getOwnPropertyNames(query[key]).length >= 1;
      const partialFilter = {};
      partialFilter[key] = query[key];

      return hasFilters ? Object.assign({}, pv, partialFilter) : pv;
    }, {}) || {};

  if (req.filters) req.filters.datetime = finalQuery;
  else req.filters = { datetime: finalQuery };

  next();
}

module.exports = { withDateFilters: withDateFilters };
