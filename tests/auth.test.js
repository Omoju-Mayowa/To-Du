import { jest } from '@jest/globals'
import request from 'supertest'

// Must use unstable_mockModule for ES modules
const mockReadUsers = jest.fn()
const mockWriteUsers = jest.fn()
const mockReadTasks = jest.fn()
const mockWriteTasks = jest.fn()
const mockSendEmail = jest.fn()

await jest.unstable_mockModule('../utils/fileHelper.js', () => ({
  readUsers: mockReadUsers,
  writeUsers: mockWriteUsers,
  readTasks: mockReadTasks,
  writeTasks: mockWriteTasks,
}))

await jest.unstable_mockModule('../config/redis.js', () => ({
  redisClient: {
    sendCommand: jest.fn(),
  },
}))

await jest.unstable_mockModule('../utils/cronJobs.js', () => ({
  default: jest.fn(),
  reminderJob: jest.fn(),
}))

await jest.unstable_mockModule('../middleware/rateLimiter.js', () => ({
  loginLimiter: jest.fn((req, res, next) => next()),
  userLimiter: jest.fn((req, res, next) => next()),
  taskLimiter: jest.fn((req, res, next) => next()),
}))

// Import AFTER mocking
const { default: app } = await import('../app.js')

const mockUsers = []

beforeEach(() => {
  mockUsers.length = 0
  mockReadUsers.mockResolvedValue([...mockUsers])
  mockWriteUsers.mockImplementation(async (users) => {
    mockUsers.length = 0
    mockUsers.push(...users)
    mockReadUsers.mockResolvedValue([...mockUsers])
  })
  mockSendEmail.mockResolvedValue(true)
})
describe('POST /users/register', () => {
  test('should register a new user', async () => {
    const res = await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'nox@example.com',
      password: 'password123',
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.email).toBe('nox@example.com')
    expect(res.body.password).toBeUndefined()
  })

  test('should reject duplicate email', async () => {
    await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'nox@example.com',
      password: 'password123',
    })
    const res = await request(app).post('/users/register').send({
      userName: 'Nox2',
      email: 'nox@example.com',
      password: 'password123',
    })
    expect(res.statusCode).toBe(422)
  })

  test('should reject missing fields', async () => {
    const res = await request(app).post('/users/register').send({
      email: 'nox@example.com',
    })
    expect(res.statusCode).toBe(400)
  })

  test('should reject invalid email', async () => {
    const res = await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'notanemail',
      password: 'password123',
    })
    expect(res.statusCode).toBe(400)
  })

  test('should reject short password', async () => {
    const res = await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'nox@example.com',
      password: '123',
    })
    expect(res.statusCode).toBe(400)
  })

  test('should escape XSS in username', async () => {
    const res = await request(app).post('/users/register').send({
      userName: '<script>alert("xss")</script>',
      email: 'nox@example.com',
      password: 'password123',
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.userName).not.toContain('<script>')
  })

  test('should normalize email to lowercase', async () => {
    const res = await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'NOX@EXAMPLE.COM',
      password: 'password123',
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.email).toBe('nox@example.com')
  })
})

describe('POST /users/login', () => {
  beforeEach(async () => {
    await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'nox@example.com',
      password: 'password123',
    })
  })

  test('should login successfully', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'nox@example.com',
      password: 'password123',
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['set-cookie']).toBeDefined()
    expect(res.body.password).toBeUndefined()
  })

  test('should reject wrong password', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'nox@example.com',
      password: 'wrongpassword',
    })
    expect(res.statusCode).toBe(401)
  })

  test('should reject non-existent email', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'ghost@example.com',
      password: 'password123',
    })
    expect(res.statusCode).toBe(401)
  })

  test('should reject missing fields', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'nox@example.com',
    })
    expect(res.statusCode).toBe(400)
  })

  test('should normalize email on login', async () => {
    const res = await request(app).post('/users/login').send({
      email: 'NOX@EXAMPLE.COM',
      password: 'password123',
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('POST /users/logout', () => {
  test('should logout successfully', async () => {
    await request(app).post('/users/register').send({
      userName: 'Nox',
      email: 'nox@example.com',
      password: 'password123',
    })

    const loginRes = await request(app).post('/users/login').send({
      email: 'nox@example.com',
      password: 'password123',
    })

    const cookies = loginRes.headers['set-cookie']

    const res = await request(app)
      .post('/users/logout')
      .set('Cookie', cookies)

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('Logged out successfully.')
  })

  test('should reject logout without token', async () => {
    const res = await request(app).post('/users/logout')
    expect(res.statusCode).toBe(401)
  })
})