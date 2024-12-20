const express = require('express');
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
    cluster.fork();
  });
} else {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Sample in-memory database
  let todos = [];

  // CRUD operations
  app.get('/todos', (req, res) => {
    res.send(todos);
  });

  app.post('/todos', (req, res) => {
    const newTodo = { id: Date.now(), ...req.body };
    todos.push(newTodo);
    res.status(201).send(newTodo);
  });

  app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const index = todos.findIndex(todo => todo.id == id);
    if (index >= 0) {
      todos[index] = { ...todos[index], ...req.body };
      res.send(todos[index]);
    } else {
      res.status(404).send({ error: 'Todo not found' });
    }
  });

  app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    todos = todos.filter(todo => todo.id != id);
    res.status(204).send();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.listen(PORT, () => {
    console.log(`TODO service running on port ${PORT} - Worker ${process.pid}`);
  });
}
