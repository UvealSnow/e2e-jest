const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const Users = require('../database/models/users');
const mongoose = require('../database/dbConection');
const ERRORS = require('../errors');
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
  beforeAll(async ()  => {
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

    it('Fails when password is empty', async () => {
      const { body, statusCode } = await $http.post('/login')
        .send({
          ...userCredentials,
          password: null,
        });
      
      expect(statusCode).toEqual(400);
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          message: ERRORS.LOGIN_ERROR
        })
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

    it('Should not create Recipe if difficulty is not an int in 1..3 range', async () => {
      const { body, statusCode } = await $http.post('/recipes')
        .send(recipeFactory());

      expect(statusCode).toEqual(403);
      expect(body).toEqual(
        expect.objectContaining({
          message: ERRORS.NOT_AUTHENTICATED,
        }),
      );
    });
  });
});