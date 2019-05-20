const User = require('../../models/user');
const { setupDb, teardownDb, request, createUser } = require('../../test-helpers');

jest.mock('../../lib/emails');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/users', () => {
  describe('GET /me', () => {
    it('it should return the logged in user', async () => {
      const user = await createUser();
      const response = await request('GET', '/1/users/me', {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
    });
  });

  describe('PATCH /me', () => {
    it('it should allow updating the user', async () => {
      const user = await createUser();
      const response = await request('PATCH', '/1/users/me', { name: 'other name' }, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe('other name');
    });
  });

  describe('POST /search', () => {
    it('it should list out users', async () => {
      const admin = await createUser({ roles: ['admin'] });
      const user1 = await createUser({ roles: ['user'], name: 'One' });
      const user2 = await createUser({ roles: ['user'], name: 'Two' });

      const response = await request('POST', '/1/users/search', {}, { user: admin });

      expect(response.status).toBe(200);
      const body = response.body;
      const names = body.data.map((i) => i.name);
      expect(names.includes(user1.name)).toBe(true);
      expect(names.includes(user2.name)).toBe(true);
      expect(body.meta.total > 2).toBe(true);
    });

    it('it should deny access to non-admins', async () => {
      const user = await createUser({ roles: ['user'] });
      const response = await request('POST', '/1/users/search', {}, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /', () => {
    it('should be able to create user', async () => {
      const admin = await createUser({ roles: ['admin'] });
      const response = await request(
        'POST',
        '/1/users',
        {
          email: 'hello@dominiek.com',
          password: 'verysecurepassword',
          name: 'Hello'
        },
        { user: admin }
      );
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe('Hello');
    });
    it('it should deny access to non-admins', async () => {
      const user = await createUser({ roles: ['user'] });
      const response = await request(
        'POST',
        '/1/users',
        {
          email: 'hello@dominiek.com',
          password: 'verysecurepassword',
          passwordRepeat: 'verysecurepassword',
          name: 'Hello'
        },
        { user }
      );
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /:user', () => {
    it('should be able to delete user', async () => {
      const admin = await createUser({ roles: ['admin'] });
      const user1 = await createUser({ roles: ['user'], name: 'One' });
      const response = await request('DELETE', `/1/users/${user1.id}`, {}, { user: admin });
      expect(response.status).toBe(204);
      const dbUser = await User.findById(user1._id);
      expect(dbUser.deletedAt).toBeDefined();
    });
    it('it should deny access to non-admins', async () => {
      const user = await createUser({ roles: ['user'] });
      const user1 = await createUser({ roles: ['user'], name: 'One' });
      const response = await request('DELETE', `/1/users/${user1.id}`, {}, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /:user', () => {
    it('admins should be able to update user', async () => {
      const admin = await createUser({ roles: ['admin'] });
      const user1 = await createUser({ roles: ['user'], name: 'new name' });
      const response = await request('PATCH', `/1/users/${user1.id}`, { name: 'new name' }, { user: admin });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('new name');
      const dbUser = await User.findById(user1.id);
      expect(dbUser.name).toEqual('new name');
    });
    it('it should deny access to non-admins', async () => {
      const user = await createUser({ roles: ['user'] });
      const user1 = await createUser({ roles: ['user'], name: 'new name' });
      const response = await request('PATCH', `/1/users/${user1.id}`, { name: 'new name' }, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /:user', () => {
    it('should be able to access user', async () => {
      const admin = await createUser({ roles: ['admin'] });
      const user1 = await createUser({ roles: ['user'], name: 'One' });
      const response = await request('GET', `/1/users/${user1.id}`, {}, { user: admin });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(user1.name);
    });
    it('it should deny access to non-admins', async () => {
      const user = await createUser({ roles: ['user'] });
      const user1 = await createUser({ roles: ['user'], name: 'new name' });
      const response = await request('GET', `/1/users/${user1.id}`, {}, { user });
      expect(response.status).toBe(401);
    });
  });
});
