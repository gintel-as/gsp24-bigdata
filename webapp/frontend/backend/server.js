const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3002;

const client = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'changeme'
  },
  tls: {
    ca: fs.readFileSync('./ca.crt'),
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

app.post('/search', async (req, res) => {
  const { index, field, query } = req.body;
  try {
    const result = await client.search({
      index,
      query: {
        wildcard: { [field]: query }
      },
      size: 10000
    });
    res.json(result.hits.hits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/correlation-ids/:sessionID', async (req, res) => {
  const { sessionID } = req.params;
  try {
    const result = await client.search({
      index: 'cdr_logs-2024.07.08', // Replace with your actual index
      body: {
        query: {
          match: { sessionID }
        }
      }
    });
    const correlationIDs = result.hits.hits[0]._source.correlationID.split(',');
    res.json(correlationIDs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
