const RecipeErrors = {
  INVALID_VEGETARIAN: "The 'vegetarian' field should be a boolean.",
  INVALID_NAME: "The 'name' field is required.",
  INVALID_DIFFICULTY: "The 'difficulty' field should be an integer between 1 and 3.",
  INVALID_INPUT: 'Please provide data to update the Recipe.',
  NOT_FOUND: (id = '') => `Recipe with ID ${id} does not exist.`,
};

module.exports = RecipeErrors;
