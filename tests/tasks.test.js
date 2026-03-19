import { jest } from '@jest/globals'
import request from 'supertest'

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

await jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  default: mockSendEmail,
}))

await jest.unstable_mockModule('../middleware/rateLimiter.js', () => ({
  loginLimiter: jest.fn((req, res, next) => next()),
  userLimiter: jest.fn((req, res, next) => next()),
  taskLimiter: jest.fn((req, res, next) => next()),
}))

const { default: app } = await import('../app.js')

const mockUsers = []
const mockTasks = []

const registerAndLogin = async ({
  userName,
  email,
  password = 'password123',
}) => {
  await request(app).post('/api/users/register').send({ userName, email, password })

  const loginRes = await request(app).post('/api/users/login').send({
    email,
    password,
  })

  return {
    cookies: loginRes.headers['set-cookie'],
    user: mockUsers.find((u) => u.email === email),
  }
}

beforeEach(() => {
  mockUsers.length = 0
  mockTasks.length = 0

  mockReadUsers.mockResolvedValue([...mockUsers])
  mockReadTasks.mockResolvedValue([...mockTasks])

  mockWriteUsers.mockImplementation(async (users) => {
    mockUsers.length = 0
    mockUsers.push(...users)
    mockReadUsers.mockResolvedValue([...mockUsers])
  })

  mockWriteTasks.mockImplementation(async (tasks) => {
    mockTasks.length = 0
    mockTasks.push(...tasks)
    mockReadTasks.mockResolvedValue([...mockTasks])
  })

  mockSendEmail.mockResolvedValue(true)
})

describe('Task routes', () => {
  test('should reject creating a task without auth', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Task 1',
      body: 'Task body',
      priority: 'medium',
    })

    expect(res.statusCode).toBe(401)
  })

  test('should create a task for an authenticated user', async () => {
    const { cookies, user } = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({
        title: 'Do laundry',
        body: 'Sort colors first',
        priority: 'high',
      })

    expect(res.statusCode).toBe(200)
    expect(res.body.title).toBe('Do laundry')
    expect(res.body.userID).toBe(user.id)
    expect(mockTasks).toHaveLength(1)
  })

  test('should validate required fields when creating a task', async () => {
    const { cookies } = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({
        title: 'Incomplete task',
        priority: 'medium',
      })

    expect(res.statusCode).toBe(400)
  })

  test('should fetch only the current user tasks', async () => {
    const userOne = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const userTwo = await registerAndLogin({
      userName: 'Ada',
      email: 'ada@example.com',
    })

    await request(app)
      .post('/api/tasks')
      .set('Cookie', userOne.cookies)
      .send({
        title: 'User one task',
        body: 'body one',
        priority: 'medium',
      })

    await request(app)
      .post('/api/tasks')
      .set('Cookie', userTwo.cookies)
      .send({
        title: 'User two task',
        body: 'body two',
        priority: 'low',
      })

    const res = await request(app)
      .get('/api/tasks')
      .set('Cookie', userOne.cookies)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('User one task')
  })

  test('should fetch, update and change status of a task', async () => {
    const { cookies } = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({
        title: 'Initial title',
        body: 'Initial body',
        priority: 'low',
      })

    const taskId = createRes.body.id

    const fetchRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Cookie', cookies)

    expect(fetchRes.statusCode).toBe(201)
    expect(fetchRes.body.id).toBe(taskId)

    const updateRes = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Cookie', cookies)
      .send({
        title: 'Updated title',
        body: 'Updated body',
        priority: 'utmost',
      })

    expect(updateRes.statusCode).toBe(200)
    expect(updateRes.body.title).toBe('Updated title')
    expect(updateRes.body.priority).toBe('utmost')

    const statusRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Cookie', cookies)
      .send({ status: 'completed' })

    expect(statusRes.statusCode).toBe(200)
    expect(statusRes.body.status).toBe('completed')
  })

  test('should send reminder for an owned task', async () => {
    const { cookies } = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({
        title: 'Reminder task',
        body: 'Needs reminder',
        priority: 'high',
      })

    const reminderRes = await request(app)
      .post(`/api/tasks/${createRes.body.id}/reminder`)
      .set('Cookie', cookies)

    expect(reminderRes.statusCode).toBe(200)
    expect(reminderRes.body.message).toBe('Reminder sent successfully.')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should delete a task', async () => {
    const { cookies } = await registerAndLogin({
      userName: 'Nox',
      email: 'nox@example.com',
    })

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Cookie', cookies)
      .send({
        title: 'Delete me',
        body: 'Task body',
        priority: 'medium',
      })

    const deleteRes = await request(app)
      .delete(`/api/tasks/${createRes.body.id}`)
      .set('Cookie', cookies)

    expect(deleteRes.statusCode).toBe(200)

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Cookie', cookies)

    expect(listRes.statusCode).toBe(200)
    expect(listRes.body).toHaveLength(0)
  })
})
