const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Initialize the Elasticsearch client with authentication and SSL/TLS settings
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

// Middleware setup: CORS for handling cross-origin requests and JSON parsing for request bodies
app.use(cors());
app.use(express.json());

// Endpoint to handle search requests
app.post('/search', async (req, res) => {
  const { index, field, query } = req.body;
  try {
    const result = await client.search({
      index,
      query: {
        wildcard: { [field]: `*${query}*` },
      },
      size: 10000
    });
    res.json(result.hits.hits); // Respond with the search results
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle any errors
  }
});

// Endpoint to retrieve past retriggers IDs based on a session ID
app.get('/correlation-ids/:sessionID', async (req, res) => {
  const { sessionID } = req.params;
  try {
    const result = await client.search({
      index: 'adapter_logs',
      query: {
        bool: {
          must: [
            { term: { sessionID: sessionID } },
            { wildcard: { log_message: '*eventincomingcall*' } }
          ]
        }
      },
      size: 10000
    });

    if (result.hits.hits.length === 0) {
      return res.status(404).json({ error: 'No correlation IDs found for the given session ID' });
    }

    const rootSession = extractFirstGtSessionId(result.hits.hits[0]._source.log_message);

    try {
      const incomingEventResult = await client.search({
        index: 'adapter_logs',
        query: {
          bool: {
            must: [
              { wildcard: { log_message: `*${rootSession}*` } },
              { wildcard: { log_message: '*eventincomingcall*' } }
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

      res.json(incomingEvents); // Respond with the incoming events
    } catch (error) {
      res.status(500).json({ error: error.message }); // Handle any errors
    }

  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle any errors
  }
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Utility function to extract the first gtSessionId from a log message
function extractFirstGtSessionId(logMessage) {
  const match = logMessage.match(/gtSessionId='([^,']+)[,']/);
  return match ? match[1] : null;
}

// Utility function to extract the retriggeredFromSessionId from a log message
function extractRetriggeredFromSessionId(logMessage) {
  const match = logMessage.match(/retriggeredFromSessionId=(\d+)/);
  return match ? match[1] : null;
}

// Endpoint to create/update call lists
app.get('/calls/create', async (req, res) => {

  try {
    const result = await client.search({
      index: 'adapter_logs',
      query: {
        wildcard: { log_message: '*eventincomingcall*' }
      },
      size: 10000
    });

    const incomingEvents = result.hits.hits.map(hit => {
      const log_message = hit._source.log_message;
      const retriggeredFromSessionIds = extractRetriggeredFromSessionIds(log_message);
      const serviceKey = extractServiceKey(log_message);
      const currentSessionId = hit._source.sessionID;
      const timestamp = hit._source.timestamp;
      const servedUser = extractServedUser(log_message);

      return {
        currentSessionId,
        retriggeredFromSessionIds,
        serviceKey,
        timestamp,
        servedUser
      };
    });

    const callsList = [];
    const sessions = new Map();
    let i = 0;

    for (let event of incomingEvents) {
      let parentSessionId = null;
      for (let retriggeredSessionId of event.retriggeredFromSessionIds) {
        if (!sessions.has(retriggeredSessionId)) {
          sessions.set(retriggeredSessionId, {
            sessionId: retriggeredSessionId,
            parents: parentSessionId ? [parentSessionId] : [],
            children: [],
            serviceKey: null,
            timestamp: null,
            servedUser: null,
            success: await checkSessionSuccess(retriggeredSessionId)
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
          timestamp: event.timestamp,
          servedUser: event.servedUser,
          success: await checkSessionSuccess(event.currentSessionId)
        });
      } else {
        const currentSession = sessions.get(event.currentSessionId);
        currentSession.serviceKey = event.serviceKey;
        currentSession.timestamp = event.timestamp;
        currentSession.servedUser = event.servedUser;
        if (parentSessionId && !currentSession.parents.includes(parentSessionId)) {
          currentSession.parents.push(parentSessionId);
        }
        // Ensure the current session gets its success value
        currentSession.success = await checkSessionSuccess(event.currentSessionId);
      }

      if (parentSessionId) {
        const parentSession = sessions.get(parentSessionId);
        if (!parentSession.children.includes(event.currentSessionId)) {
          parentSession.children.push(event.currentSessionId);
        }
      }

      let call = callsList.find(call => call.sessionIDs.includes(event.currentSessionId) || call.sessionIDs.some(r => event.retriggeredFromSessionIds.includes(r)));
      if (!call) {
        call = {
          id: i,
          sessionIDs: [...event.retriggeredFromSessionIds, event.currentSessionId],
          earliestTime: new Date(event.timestamp+'+02:00'),
          latestTime: new Date(event.timestamp+'+02:00'),
          serviceKey: event.serviceKey,
          success: true
        };
        i += 1;
        callsList.push(call);
      } else {
        call.sessionIDs.push(...event.retriggeredFromSessionIds);
        call.sessionIDs.push(event.currentSessionId);
        call.sessionIDs = [...new Set(call.sessionIDs)];
        call.earliestTime = new Date(Math.min(new Date(call.earliestTime).getTime(), new Date(event.timestamp+'+02:00').getTime()));
        call.latestTime = new Date(Math.max(new Date(call.latestTime).getTime(), new Date(event.timestamp+'+02:00').getTime()));
      }

      // Determine if the call is successful
      call.success = await determineCallSuccess(call, sessions);
    }

    await createIndexAndIngest("call-list", callsList);


    res.status(200).json({
      message: 'Calls created/updated successfully.',
      callsList,
      sessions: Array.from(sessions.values())
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Utility function to check if a session was successful
async function checkSessionSuccess(sessionId) {
  try {
    const result = await client.search({
      index: 'adapter_logs',
      query: {
        bool: {
          must: [
            { term: { sessionID: sessionId } },
            { wildcard: { log_message: '*answered*' } }
          ],
          must_not: [
            { wildcard: { log_message: '*firstanswered*' } },
            { wildcard: { log_message: '*logworker*' } },
            { wildcard: { log_message: '*eanswered*' } },

          ]
        }
      },
      size: 1
    });
    return result.hits.total.value > 0;
  } catch (error) {
    console.error(`Error checking session success for ${sessionId}:`, error);
    return false;
  }
}

// Utility function to determine the success of a call
async function determineCallSuccess(call, sessions) {
  const rootId = call.sessionIDs[0];
  return checkNodeSuccess(rootId, sessions);
}

// Utility function to check the success of a node in the session tree
async function checkNodeSuccess(nodeId, sessions) {
  const session = sessions.get(nodeId);
  if (!session.success) {
    return false;
  }

  let hasUnsuccessfulTerm = false;

  for (let childId of session.children) {
    const childSession = sessions.get(childId);

    if (childSession && childSession.serviceKey && childSession.serviceKey.includes("Click2DialCoreLeg1")) {
      hasUnsuccessfulTerm = true;
    } else if (childSession && childSession.success) {
      return checkNodeSuccess(childId, sessions);
    } else if (childSession && childSession.serviceKey && childSession.serviceKey.includes("term")) {
      hasUnsuccessfulTerm = true;
    }
  }

  return !hasUnsuccessfulTerm;
}

// Utility function to extract retriggered session IDs from a log message
function extractRetriggeredFromSessionIds(logMessage) {
  const match = logMessage.match(/gtSessionId='([^']+)'/);
  return match ? match[1].split(',').filter(id => id && id !== 'null' && id !== '-1') : [];
}

// Utility function to extract the service key from a log message
function extractServiceKey(logMessage) {
  const match = logMessage.match(/serviceKey='([^']+)'/);
  return match ? match[1] : null;
}

// Utility function to extract the served user from a log message
function extractServedUser(logMessage) {
  const match = logMessage.match(/servedUser='([^']+)'/);
  return match ? match[1] : null;
}

async function createIndexAndIngest(indexName, callsList) {
  try {
    const indexExists = await client.indices.exists({ index: indexName });

    if (indexExists) {
      const errorMessage = `Index "${indexName}" already exists.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              sessionIDs: { type: "keyword" },  // Array of strings
              earliestTime: { type: "date" },
              latestTime: { type: "date" },
              serviceKey: { type: "keyword" },
            },
          },
        },
      });
      console.log(`Index "${indexName}" created successfully.`);
    }

    // Ingest documents into the index
    const bulkBody = [];
    callsList.forEach(call => {
      bulkBody.push({
        index: {
          _index: indexName,
          _id: call.id
        }
      });
      bulkBody.push(call);
    });

    const result = await client.bulk({ body: bulkBody });
    if (result.errors) {
      console.error('Errors occurred while ingesting documents:', bulkResponse.items);
    } else {
      console.log(`Successfully ingested ${callsList.length} documents into index "${indexName}".`);
    }

  } catch (error) {
    console.error(`Error creating index "${indexName}" and ingesting documents:`, error);
  }
}
