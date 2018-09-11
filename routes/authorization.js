function hasRoles(roles) {
  return function(req, res, next) {
    const accessGranted = roles.reduce(function(pv, cv) {
      return pv || req.payload.roles.includes(cv);
    }, false);

    if (!accessGranted) return res.sendStatus(401);
    next();
  };
}

module.exports = hasRoles
