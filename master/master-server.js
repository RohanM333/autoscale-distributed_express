const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry');

const app = express();
const PORT = process.env.PORT || 4000;

// Configure axios to retry on failures
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const subMasters = {
  todo: 'http://192.168.2.1', // Sub-master Load Balancer for Todo Service
  user: 'http://192.168.3.1' // Sub-master Load Balancer for User Service
};

app.use(express.json());

const forwardRequest = async (req, res, target) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${target}${req.originalUrl}`,
      headers: req.headers,
      data: req.body
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(500).send(`Failed to forward request: ${error.message}`);
  }
};

app.use('/todos', (req, res) => forwardRequest(req, res, subMasters.todo));
app.use('/users', (req, res) => forwardRequest(req, res, subMasters.user));

app.listen(PORT, () => {
  console.log(`Master Express server is running on port ${PORT}`);
});
