const UserErrors = require('./UserErrors');
const RecipeErrors = require('./RecipeErrors');

const ERRORS = {
  ...UserErrors,
  ...RecipeErrors,
};

module.exports = ERRORS;
