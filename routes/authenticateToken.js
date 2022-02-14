/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const ERRORS = require('../errors');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  // if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, recipe) => {
    if (err) {
      return res.status(403).send({
        message: ERRORS.NOT_AUTHENTICATED,
      });
    }
    req.user = recipe;
    next();
  });
}
module.exports = authenticateToken;
