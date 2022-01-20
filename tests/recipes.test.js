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
});