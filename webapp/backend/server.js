const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const fs = require('fs');
const { query } = require('express');
const path = require('path');


const app = express();
const port = 3000;

const client = new Client({
  node: 'https://es01:9200',
  auth: {
    username: 'elastic',
    password: 'changeme'
  },
  tls: {
    ca: fs.readFileSync(path.join(__dirname, 'certs', 'ca', 'ca.crt')),
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
        wildcard: { [field]: `*${query}*` }  // Make sure to wrap query with *
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
      index: 'adapter_logs-2024.07.10', // Replace with your actual index
      query: {
        bool: {
          must: [
            {
              term: { sessionID: sessionID }
            },
            {
              wildcard: { log_message: '*eventincomingcall*' }
            }
          ]
        }
      },
      size: 10000
    });

    console.log(result.hits.hits);
    if (result.hits.hits.length === 0) {
      return res.status(404).json({ error: 'No correlation IDs found for the given session ID' });
    }

    const rootSession = extractFirstGtSessionId(result.hits.hits[0]._source.log_message);
    console.log(rootSession);

    try {
      const incomingEventResult = await client.search({
        index: 'adapter_logs-2024.07.10', // Replace with your actual index
        query: {
          bool: {
            must: [
              {
                wildcard: { log_message: `*${rootSession}*` }
              },
              {
                wildcard: { log_message: '*eventincomingcall*' }
              }
            ]
          }
        },
        size: 10000
      });

      const incomingEvents = incomingEventResult.hits.hits.map(hit => {
        const log_message = hit._source.log_message;
        const retriggeredFromSessionId = extractRetriggeredFromSessionId(log_message);
        const serviceKey = extractServiceKey(log_message);
        const currentSessionId = hit._source.sessionID;

        return {
          currentSessionId,
          retriggeredFromSessionId,
          serviceKey
        };
      });

      console.log(incomingEvents);
      res.json(incomingEvents); //Look here
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function extractFirstGtSessionId(logMessage) {
  const match = logMessage.match(/gtSessionId='([^,]+),/);
  return match ? match[1] : null;
}

function extractRetriggeredFromSessionId(logMessage) {
  const match = logMessage.match(/retriggeredFromSessionId=(\d+)/);
  return match ? match[1] : null;
}

function extractServiceKey(logMessage) {
  const match = logMessage.match(/serviceKey='([^']+)'/);
  return match ? match[1] : null;
}
