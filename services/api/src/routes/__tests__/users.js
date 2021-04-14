const { setupDb, teardownDb, request, createUser, createUserWithRole } = require('../../utils/testing');
const { User } = require('../../models');

jest.mock('../../utils/emails');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/users', () => {
  describe('GET /me', () => {
    it('should return the logged in user', async () => {
      const user = await createUser();
      const response = await request('GET', '/1/users/me', {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should expose id getter', async () => {
      const user = await createUser();
      const response = await request('GET', '/1/users/me', {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
    });

    it('should not expose _id or __v', async () => {
      const user = await createUser();
      const response = await request('GET', '/1/users/me', {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data._id).toBeUndefined();
      expect(response.body.data.__v).toBeUndefined();
    });

    it('should not expose _password or hashedPassword', async () => {
      const user = await createUser({
        password: 'fake password',
      });
      const response = await request('GET', '/1/users/me', {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data._password).toBeUndefined();
      expect(response.body.data.hashedPassword).toBeUndefined();
    });
  });

  describe('PATCH /me', () => {
    it('should allow updating the user', async () => {
      const user = await createUser();
      const response = await request('PATCH', '/1/users/me', { firstName: 'Other', lastName: 'Name' }, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('Other');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.fullName).toBe('Other Name');
    });
  });

  describe('POST /', () => {
    it('should be able to create user', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const response = await request(
        'POST',
        '/1/users',
        {
          email: 'hello@dominiek.com',
          password: 'verysecurepassword',
          firstName: 'Mellow',
          lastName: 'Yellow',
        },
        { user: admin }
      );
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.firstName).toBe('Mellow');
      expect(data.lastName).toBe('Yellow');
      expect(data.fullName).toBe('Mellow Yellow');
    });
    it('should deny access to non-admins', async () => {
      const user = await createUser({});
      const response = await request(
        'POST',
        '/1/users',
        {
          email: 'hello@dominiek.com',
          password: 'verysecurepassword',
          passwordRepeat: 'verysecurepassword',
          firstName: 'Mellow',
          lastName: 'Yellow',
        },
        { user }
      );
      expect(response.status).toBe(401);
    });
  });

  describe('GET /:user', () => {
    it('should be able to access user', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'Neo', lastName: 'One' });
      const response = await request('GET', `/1/users/${user1.id}`, {}, { user: admin });
      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe(user1.firstName);
      expect(response.body.data.lastName).toBe(user1.lastName);
    });
    it('should deny access to non-admins', async () => {
      const user = await createUser({});
      const user1 = await createUser({ firstName: 'New', lastName: 'Name' });
      const response = await request('GET', `/1/users/${user1.id}`, {}, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /search', () => {
    it('should list out users', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'Neo', lastName: 'One' });
      const user2 = await createUser({ firstName: 'Riker', lastName: 'Two' });

      const response = await request('POST', '/1/users/search', {}, { user: admin });
      expect(response.status).toBe(200);
      const body = response.body;
      const names = body.data.map((i) => i.fullName);
      expect(names.includes(user1.fullName)).toBe(true);
      expect(names.includes(user2.fullName)).toBe(true);
      expect(body.meta.total > 2).toBe(true);
    });

    it('should be able to search by ids', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');

      const user1 = await createUser({ firstName: 'Neo', lastName: 'One' });
      const user2 = await createUser({ firstName: 'Riker', lastName: 'Two' });

      const response = await request(
        'POST',
        '/1/users/search',
        {
          ids: [user1.id, user2.id],
        },
        { user: admin }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].id).toBe(user2.id);
      expect(response.body.data[1].id).toBe(user1.id);
    });

    it('should deny access to non-admins', async () => {
      const user = await createUser({});
      const response = await request('POST', '/1/users/search', {}, { user });
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /:user', () => {
    it('admins should be able to update user', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'Old', lastName: 'Name' });
      const response = await request(
        'PATCH',
        `/1/users/${user1.id}`,
        { firstName: 'New', lastName: 'Name' },
        { user: admin }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.lastName).toBe('Name');
      const dbUser = await User.findById(user1.id);
      expect(dbUser.fullName).toEqual('New Name');
    });

    it('should deny access to non-admins', async () => {
      const user = await createUser({});
      const user1 = await createUser({ firstName: 'New', lastName: 'Name' });
      const response = await request('PATCH', `/1/users/${user1.id}`, { name: 'new name' }, { user });
      expect(response.status).toBe(401);
    });

    it('should be able to update user roles', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'New', lastName: 'Name' });
      const response = await request(
        'PATCH',
        `/1/users/${user1.id}`,
        {
          roles: [
            {
              role: 'limitedAdmin',
              scope: 'global',
            },
          ],
        },
        { user: admin }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.roles.length).toBe(1);
      expect(response.body.data.roles[0].role).toBe('limitedAdmin');
      expect(response.body.data.roles[0].scope).toBe('global');
      const dbUser = await User.findById(user1.id);
      expect(dbUser.roles.length).toBe(1);
      expect(dbUser.roles[0].role).toBe('limitedAdmin');
      expect(dbUser.roles[0].scope).toBe('global');
    });

    it('should strip out reserved fields', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'New', lastName: 'Name' });
      const response = await request(
        'PATCH',
        `/1/users/${user1.id}`,
        { firstName: 'New', lastName: 'Name', id: 'fake id', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
        { user: admin }
      );
      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('New');
      expect(response.body.data.lastName).toBe('Name');
      const dbUser = await User.findById(user1.id);
      expect(dbUser.fullName).toEqual('New Name');
    });
  });

  describe('DELETE /:user', () => {
    it('should be able to delete user', async () => {
      const admin = await createUserWithRole('global', 'superAdmin');
      const user1 = await createUser({ firstName: 'Neo', lastName: 'One' });
      const response = await request('DELETE', `/1/users/${user1.id}`, {}, { user: admin });
      expect(response.status).toBe(204);
      const dbUser = await User.findById(user1._id);
      expect(dbUser.deletedAt).toBeDefined();
    });
    it('should deny access to non-admins', async () => {
      const user = await createUser({});
      const user1 = await createUser({ firstName: 'Neo', lastName: 'One' });
      const response = await request('DELETE', `/1/users/${user1.id}`, {}, { user });
      expect(response.status).toBe(401);
    });
  });
});
