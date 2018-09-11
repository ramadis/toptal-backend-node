function hasRoles(roles) {
  return function(req, res, next) {
    const accessGranted = roles.reduce(function(pv, cv) {
      return pv && req.user.hasOwnProperty(cv);
    }, true);

    if (!accessGranted) return res.sendStatus(401);
    next();
  };
}

module.exports = { hasRoles: hasRoles };
