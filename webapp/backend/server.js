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
      index: 'adapter_logs', // Replace with your actual index
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
        index: 'adapter_logs', // Replace with your actual index
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
  const match = logMessage.match(/gtSessionId='([^,']+)[,']/);
  return match ? match[1] : null;
}

function extractRetriggeredFromSessionId(logMessage) {
  const match = logMessage.match(/retriggeredFromSessionId=(\d+)/);
  return match ? match[1] : null;
}

app.get('/calls/create', async (req, res) => {
  await checkAndCreateIndex("call-list");

  try {
    const result = await client.search({
      index: 'adapter_logs', // Replace with your actual index
      query: {
        wildcard: {log_message: '*eventincomingcall*'}
      },
      size: 10000
    });

    const incomingEvents = result.hits.hits.map(hit => {
      const log_message = hit._source.log_message;
      const retriggeredFromSessionIds = extractRetriggeredFromSessionIds(log_message);
      const serviceKey = extractServiceKey(log_message);
      const currentSessionId = hit._source.sessionID;
      const timestamp = hit._source.timestamp;

      return {
        currentSessionId,
        retriggeredFromSessionIds,
        serviceKey,
        timestamp
      };
    }).filter(event => event.retriggeredFromSessionIds.length > 0 && !event.retriggeredFromSessionIds.includes('-1'));

    const callsList = [];
    const sessions = new Map(); // Map to store session objects
    let i = 0;
    for (let event of incomingEvents) {
      console.log(event.retriggeredFromSessionIds);

      // Iterate through the retriggeredFromSessionIds array
      let parentSessionId = null;
      for (let retriggeredSessionId of event.retriggeredFromSessionIds) {
        if (!sessions.has(retriggeredSessionId)) {
          sessions.set(retriggeredSessionId, {
            sessionId: retriggeredSessionId,
            parents: parentSessionId ? [parentSessionId] : [],
            children: [],
            serviceKey: null,
            timestamp: null
          });
        } else if (parentSessionId) {
          const session = sessions.get(retriggeredSessionId);
          if (!session.parents.includes(parentSessionId)) {
            session.parents.push(parentSessionId);
          }
        }

        if (parentSessionId) {
          const parentSession = sessions.get(parentSessionId);
          if (!parentSession.children.includes(retriggeredSessionId)) {
            parentSession.children.push(retriggeredSessionId);
          }
        }

        parentSessionId = retriggeredSessionId;
      }

      // Handle the current session ID
      if (!sessions.has(event.currentSessionId)) {
        sessions.set(event.currentSessionId, {
          sessionId: event.currentSessionId,
          parents: parentSessionId ? [parentSessionId] : [],
          children: [],
          serviceKey: event.serviceKey,
          timestamp: event.timestamp
        });
      } else {
        const currentSession = sessions.get(event.currentSessionId);
        currentSession.serviceKey = event.serviceKey;
        currentSession.timestamp = event.timestamp;
        if (parentSessionId && !currentSession.parents.includes(parentSessionId)) {
          currentSession.parents.push(parentSessionId);
        }
      }

      if (parentSessionId) {
        const parentSession = sessions.get(parentSessionId);
        if (!parentSession.children.includes(event.currentSessionId)) {
          parentSession.children.push(event.currentSessionId);
        }
      }

      let call = callsList.find(call => call.sessionIDs.includes(event.currentSessionId) || call.sessionIDs.some(r => event.retriggeredFromSessionIds.includes(r)));
      if (!call) {
        // If call doesn't exist, create a new one
        call = {
          id: i,
          sessionIDs: [...event.retriggeredFromSessionIds, event.currentSessionId],
          earliestTime: event.timestamp,
          latestTime: event.timestamp,
          serviceKey: event.serviceKey,
          success: true
        };
        i += 1
        callsList.push(call);

      } else {
        // Update the existing call with new sessionID and update timestamps if necessary
        call.sessionIDs.push(event.currentSessionId);
        call.sessionIDs.push(...event.retriggeredFromSessionIds);
        call.sessionIDs = [...new Set(call.sessionIDs)]; // Ensure uniqueness
        call.earliestTime = new Date(Math.min(new Date(call.earliestTime).getTime(), new Date(event.timestamp).getTime()));
        call.latestTime = new Date(Math.max(new Date(call.latestTime).getTime(), new Date(event.timestamp).getTime()));
      }
    }

    res.status(200).json({
      message: 'Calls created/updated successfully.',
      callsList,
      sessions: Array.from(sessions.values())
    });

  } catch (error) {
    res.status(500).json({error: error.message});
  }
});


function extractRetriggeredFromSessionIds(logMessage) {
  const match = logMessage.match(/gtSessionId='([^']+)'/);
  return match ? match[1].split(',').filter(id => id && id !== 'null' && id !== '-1') : [];
}


function extractServiceKey(logMessage) {
  const match = logMessage.match(/serviceKey='([^']+)'/);
  return match ? match[1] : null;
}


async function checkAndCreateIndex(indexName) {
  try {
    const { body: indexExists } = await client.indices.exists({ index: indexName });

    if (indexExists) {
      console.log(`Index "${indexName}" already exists.`);
    } else {
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              sessionIDs: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  parents: { type: 'keyword' },
                  children: { type: 'keyword' },
                  timestamp: { type: 'date' },
                  serviceKey: { type: 'keyword' }
                }
              }
            }
          }
        }
      });
      console.log(`Index "${indexName}" created successfully.`);
    }
  } catch (error) {
    console.error(`Error checking or creating index "${indexName}":`);
  }
}