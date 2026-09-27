jest.mock('../src/models/Task');

const request = require('supertest');
const Task = require('../src/models/Task');
const app = require('../src/app');

describe('Task endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/tasks creates a task', async () => {
    const savedTask = {
      _id: '66a111111111111111111111',
      title: 'Learn Docker',
      description: 'Build a containerized API',
      completed: false
    };

    Task.create.mockResolvedValue(savedTask);

    const response = await request(app).post('/api/tasks').send({
      title: 'Learn Docker',
      description: 'Build a containerized API'
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Learn Docker');
    expect(Task.create).toHaveBeenCalledWith({
      title: 'Learn Docker',
      description: 'Build a containerized API',
      completed: undefined
    });
  });

  test('GET /api/tasks returns tasks', async () => {
    const tasks = [
      { _id: '1', title: 'Docker', completed: true },
      { _id: '2', title: 'CI/CD', completed: false }
    ];

    const sort = jest.fn().mockResolvedValue(tasks);
    Task.find.mockReturnValue({ sort });

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(tasks);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  test('PUT /api/tasks/:id updates a task', async () => {
    const updatedTask = {
      _id: '66a111111111111111111111',
      title: 'Learn Docker',
      completed: true
    };

    Task.findByIdAndUpdate.mockResolvedValue(updatedTask);

    const response = await request(app)
      .put('/api/tasks/66a111111111111111111111')
      .send({ completed: true, ignoredField: 'not persisted' });

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(true);
    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
      '66a111111111111111111111',
      { completed: true },
      { new: true, runValidators: true }
    );
  });

  test('DELETE /api/tasks/:id returns 204', async () => {
    Task.findByIdAndDelete.mockResolvedValue({ _id: '66a111111111111111111111' });

    const response = await request(app).delete('/api/tasks/66a111111111111111111111');

    expect(response.status).toBe(204);
  });

  test('GET /api/tasks/:id returns 404 when task does not exist', async () => {
    Task.findById.mockResolvedValue(null);

    const response = await request(app).get('/api/tasks/66a111111111111111111111');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Task not found');
  });
});
