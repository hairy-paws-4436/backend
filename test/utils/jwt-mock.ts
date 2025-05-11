export const JwtStrategyMock = {
  name: 'jwt',
  validate: jest.fn().mockImplementation((payload) => {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }),
  authenticate: jest.fn().mockImplementation((req) => {
    req.user = { id: 'mock-user-id', email: 'mock@example.com', role: 'ADOPTER' };
    return true;
  }),
};