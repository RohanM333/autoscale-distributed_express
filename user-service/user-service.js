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
  let users = [];

  // CRUD operations
  app.get('/users', (req, res) => {
    res.send(users);
  });

  app.post('/users', (req, res) => {
    const newUser = { id: Date.now(), ...req.body };
    users.push(newUser);
    res.status(201).send(newUser);
  });

  app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const index = users.findIndex(user => user.id == id);
    if (index >= 0) {
      users[index] = { ...users[index], ...req.body };
      res.send(users[index]);
    } else {
      res.status(404).send({ error: 'User not found' });
    }
  });

  app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    users = users.filter(user => user.id != id);
    res.status(204).send();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.listen(PORT, () => {
    console.log(`USER service running on port ${PORT} - Worker ${process.pid}`);
  });
}
