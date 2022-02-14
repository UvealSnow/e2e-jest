const UserErrors = require('./UserErrors');
const RecipeErrors = require('./RecipeErrors');

const ERRORS = {
  UNKNOWN: "An error occured while processing your request.",
  ...UserErrors,
  ...RecipeErrors,
};

module.exports = ERRORS;
