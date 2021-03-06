const Recipes = require('../database/services/recipes');
const ERRORS = require('../errors');
const MESSAGES = require('../messages');

const RecipesController = {
  // Retrieve and return all recipes from the database.
  getAll: async (req, res) => {
    try {
      const results = await Recipes.allRecipes();

      return res.status(200).send({
        success: true,
        data: results,
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: ERRORS.UNKNOWN,
      });
    }
  },

  // Create and Save a new Recipes
  create: async (req, res) => {
    console.log('create');
    try {
      // define variables
      const {
        name, difficulty, vegetarian,
      } = req.body;

      // validate vegetarian
      if (typeof vegetarian !== 'boolean') {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_VEGETARIAN,
        });
      }
      // validate name
      if (!req.body.name) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_NAME,
        });
      }

      // validate difficulty
      if ((typeof difficulty !== 'number') || (difficulty <= 0) || (difficulty > 3)) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_DIFFICULTY,
        });
      }

      const recipesDetail = {
        name,
        difficulty,
        vegetarian,
      };

      // Save user in the database
      const recipes = await Recipes.saveRecipes(recipesDetail);

      return res.status(201).send({
        success: true,
        data: recipes,
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: ERRORS.UNKNOWN,
      });
    }
  },

  // Find a single recipes with an id
  getOne: async (req, res) => {
    try {
      const { id } = req.params;

      // retrive recipes info
      const recipes = await Recipes.fetchById(id);
      if (!recipes) {
        return res.status(404).send({
          success: false,
          message: ERRORS.NOT_FOUND(id),
        });
      }

      return res.send({
        success: true,
        data: recipes,
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: ERRORS.UNKNOWN,
      });
    }
  },

  // Update the recipes identified by the parameter
  update: async (req, res) => {
    console.log('update');
    try {
      // check if req body is empty
      if (Object.keys(req.body).length === 0) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_INPUT,
        });
      }

      // validate name
      if (!req.body.name) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_NAME,
        });
      }

      // validate difficulty if it exist
      if ((req.body.difficulty) && ((typeof req.body.difficulty !== 'number') || (req.body.difficulty <= 0) || (req.body.difficulty > 3))) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_DIFFICULTY,
        });
      }
      // validate vegetarian if it exist
      if ((req.body.vegetarian) && (typeof req.body.vegetarian !== 'boolean')) {
        return res.status(400).send({
          success: false,
          message: ERRORS.INVALID_VEGETARIAN,
        });
      }

      const { id } = req.params;

      // check if recipe exist
      const recipeExist = await Recipes.fetchById(id);
      if (!recipeExist) {
        return res.status(404).send({
          success: false,
          message: ERRORS.NOT_FOUND(id),
        });
      }

      const recipesDetail = req.body;
      // Find recipe and update it with the request body
      const recipes = await Recipes.fetchByIdAndUpdate(id, recipesDetail);
      return res.status(200).send({
        success: true,
        data: recipes,
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: ERRORS.UNKNOWN,
      });
    }
  },

  // Delete the recipes identified by the parameter
  delete: async (req, res) => {
    try {
      // define variables
      const { id } = req.params;

      // Find recipe and delete
      await Recipes.fetchByIdAndDelete(id);

      return res.status(200).send({
        success: true,
        message: MESSAGES.RECIPE_DELETED,
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: ERRORS.UNKNOWN,
      });
    }
  },
};

module.exports = RecipesController;
