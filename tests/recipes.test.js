/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const Users = require('../database/models/users');
const UserService = require('../database/services/users');
const RecipeService = require('../database/services/recipes');
const mongoose = require('../database/dbConection');
const ERRORS = require('../errors');
const MESSAGES = require('../messages');

let recipeId;
let userToken;

const $http = request(app);
const userCredentials = {
  username: 'admin',
  password: 'secret',
};

const recipeFactory = (modifications = {}) => ({
  name: 'Beef Stroganoff',
  difficulty: 2,
  vegetarian: false,
  ...modifications,
});

describe('Test the recipes API', () => {
  beforeAll(async () => {
    const password = bcrypt.hashSync('secret', 10);
    await Users.create({
      username: 'admin',
      password,
    });
  });

  afterAll(async () => {
    await Users.deleteMany();
    mongoose.disconnect();
  });

  describe('[POST] /login', () => {
    it('Authenticazes User and sign them in', async () => {
      const { body, statusCode } = await $http.post('/login')
        .send(userCredentials);

      userToken = body.accessToken;
      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          accessToken: body.accessToken,
          success: true,
          data: expect.objectContaining({ ...body.data }),
        }),
      );
    });

    it('Should fail when password is empty', async () => {
      const { body, statusCode } = await $http.post('/login')
        .send({
          ...userCredentials,
          password: null,
        });

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.LOGIN_ERROR,
        }),
      );
    });

    it('Should fail if no User with such username is found', async () => {
      const { body, statusCode } = await $http.post('/login')
        .send({
          ...userCredentials,
          username: 'asd',
        });

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_CREDENTIALS,
        }),
      );
    });

    it('Should fail if password does not match', async () => {
      const { body, statusCode } = await $http.post('/login')
        .send({
          ...userCredentials,
          password: 'asd',
        });

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_CREDENTIALS,
        }),
      );
    });

    it('Should catch if there is an error finding the User', async () => {
      jest.spyOn(UserService, 'findByUsername')
        .mockRejectedValueOnce(new Error());

      const { body, statusCode } = await $http.post('/login')
        .send({ ...userCredentials });

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.LOGIN_ERROR,
        }),
      );
    });
  });

  describe('[POST] /recipes', () => {
    it('Creates a new Recipe from valid data', async () => {
      const { body, statusCode } = await $http.post('/recipes')
        .send(recipeFactory())
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(201);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );

      recipeId = body.data._id;
    });

    it('Should not create Recipe if vegetarian is not Boolean', async () => {
      const recipe = recipeFactory({
        vegetarian: 'false',
      });

      const { body, statusCode } = await $http.post('/recipes')
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_VEGETARIAN,
        }),
      );
    });

    it('Should not create Recipe if name is empty', async () => {
      const recipe = recipeFactory({
        name: undefined,
      });

      const { body, statusCode } = await $http.post('/recipes')
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_NAME,
        }),
      );
    });

    it('Should not create Recipe if difficulty is not an int in 1..3 range', async () => {
      const recipe = recipeFactory({
        difficulty: 55,
      });

      const { body, statusCode } = await $http.post('/recipes')
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_DIFFICULTY,
        }),
      );
    });

    it('Should not create Recipe if User is not authenticated', async () => {
      const { body, statusCode } = await $http.post('/recipes')
        .send(recipeFactory());

      expect(statusCode).toEqual(403);
      expect(body).toEqual(
        expect.objectContaining({
          message: ERRORS.NOT_AUTHENTICATED,
        }),
      );
    });

    it('Should catch if there is an error saving the Recipe', async () => {
      jest.spyOn(RecipeService, 'saveRecipes')
        .mockRejectedValueOnce(new Error());

      const { body, statusCode } = await $http.post('/recipes')
        .send(recipeFactory())
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.UNKNOWN,
        }),
      );
    });
  });

  describe('[GET] /recipes', () => {
    it('Should retrieve all the Recipes in the DB', async () => {
      const { body, statusCode } = await $http.get('/recipes');
      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        }),
      );
    });

    it('Should catch if there is an error fetching the Recipes', async () => {
      jest.spyOn(RecipeService, 'allRecipes')
        .mockRejectedValueOnce(new Error());

      const { body, statusCode } = await $http.get('/recipes')
        .send(recipeFactory())
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.UNKNOWN,
        }),
      );
    });
  });

  describe('[GET] /recipes/:id', () => {
    it('Should retrieve the specified Recipe from the DB', async () => {
      const { body, statusCode } = await $http.get(`/recipes/${recipeId}`);
      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('Should not retrieve the specified Recipe from the DB if given an invalid ID', async () => {
      const invalidId = 'asd';
      const { body, statusCode } = await $http.get(`/recipes/${invalidId}`);

      expect(statusCode).toEqual(404);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.NOT_FOUND(invalidId),
        }),
      );
    });

    it('Should catch if there is an error fetching the specified Recipe', async () => {
      jest.spyOn(RecipeService, 'fetchById')
        .mockRejectedValueOnce(new Error());

      const { body, statusCode } = await $http.get(`/recipes/${recipeId}`)
        .send(recipeFactory())
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.UNKNOWN,
        }),
      );
    });
  });

  describe('[PATCH] /recipes/:id', () => {
    it('Should update the specified Recipe in the DB', async () => {
      const recipe = recipeFactory();
      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('Should not update Recipe if no data is given', async () => {
      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send({})
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_INPUT,
        }),
      );
    });

    it('Should not update Recipe if vegetarian is not Boolean', async () => {
      const recipe = recipeFactory({
        vegetarian: 'false',
      });

      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_VEGETARIAN,
        }),
      );
    });

    it('Should not update Recipe if name is empty', async () => {
      const recipe = recipeFactory({
        name: '',
      });

      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_NAME,
        }),
      );
    });

    it('Should not update Recipe if difficulty is not an int in 1..3 range', async () => {
      const recipe = recipeFactory({
        difficulty: 55,
      });

      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.INVALID_DIFFICULTY,
        }),
      );
    });

    it('Should not update Recipe if an invalid ID is given', async () => {
      const id = 'asd';
      const recipe = recipeFactory();

      const { body, statusCode } = await $http.patch(`/recipes/${id}`)
        .send(recipe)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(404);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.NOT_FOUND(id),
        }),
      );
    });

    it('Should not update Recipe if User is not authenticated', async () => {
      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipeFactory());

      expect(statusCode).toEqual(403);
      expect(body).toEqual(
        expect.objectContaining({
          message: ERRORS.NOT_AUTHENTICATED,
        }),
      );
    });

    it('Should catch if there is an error updating the specified Recipe', async () => {
      jest.spyOn(RecipeService, 'fetchByIdAndUpdate')
        .mockRejectedValueOnce(new Error());

      const { body, statusCode } = await $http.patch(`/recipes/${recipeId}`)
        .send(recipeFactory())
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.UNKNOWN,
        }),
      );
    });
  });

  describe('[DELETE] /recipes/:id', () => {
    it('Should delete the specified Recipe', async () => {
      const { body, statusCode } = await $http.delete(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          message: MESSAGES.RECIPE_DELETED,
        }),
      );
    });

    it('Should NOT fail if the Recipe does not exist', async () => {
      const { body, statusCode } = await $http.delete(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(200);
      expect(body).toEqual(
        expect.objectContaining({
          success: true,
          message: MESSAGES.RECIPE_DELETED,
        }),
      );
    });

    it('Should NOT delete the Recipe if ID is invalid', async () => {
      const id = 'asd';
      const { body, statusCode } = await $http.delete(`/recipes/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toEqual(500);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.UNKNOWN,
        }),
      );
    });

    it('Should NOT delete the Recipe if User is not authenticated', async () => {
      const { body, statusCode } = await $http.delete(`/recipes/${recipeId}`);

      expect(statusCode).toEqual(403);
      expect(body).toEqual(
        expect.objectContaining({
          message: ERRORS.NOT_AUTHENTICATED,
        }),
      );
    });
  });
});
