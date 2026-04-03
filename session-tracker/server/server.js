const express = require('express');
const cors = require('cors');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 3000);
const dataFilePath = path.join(__dirname, 'data', 'activity-log.json');
const distDirectory = path.join(__dirname, '..', 'dist', 'session-tracker', 'browser');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(distDirectory, { index: false }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/logs', async (_request, response, next) => {
  try {
    const store = await readStore();
    response.json(store);
  } catch (error) {
    next(error);
  }
});

app.get('/api/logs/download', async (_request, response, next) => {
  try {
    await ensureDataFile();
    response.download(dataFilePath, createDownloadFileName());
  } catch (error) {
    next(error);
  }
});

app.post('/api/sessions', async (request, response, next) => {
  try {
    const identifier = String(request.body?.identifier ?? '').trim();

    if (!identifier) {
      response.status(400).json({ message: 'Identifier is required.' });
      return;
    }

    const store = await readStore();
    const session = {
      sessionId: store.meta.nextSessionId,
      identifier,
      loginAt: new Date().toISOString(),
      logoutAt: null,
      screenVisits: []
    };

    store.meta.nextSessionId += 1;
    store.meta.updatedAt = new Date().toISOString();
    store.sessions.push(session);

    await writeStore(store);
    response.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/sessions/:sessionId/logout', async (request, response, next) => {
  try {
    const sessionId = Number(request.params.sessionId);
    const logoutAt = String(request.body?.logoutAt ?? '').trim() || new Date().toISOString();
    const store = await readStore();
    const session = store.sessions.find((entry) => entry.sessionId === sessionId);

    if (!session) {
      response.status(404).json({ message: 'Session not found.' });
      return;
    }

    session.logoutAt = logoutAt;
    store.meta.updatedAt = new Date().toISOString();

    await writeStore(store);
    response.json(session);
  } catch (error) {
    next(error);
  }
});

app.post('/api/sessions/:sessionId/logout', async (request, response, next) => {
  try {
    const sessionId = Number(request.params.sessionId);
    const logoutAt = String(request.body?.logoutAt ?? '').trim() || new Date().toISOString();
    const store = await readStore();
    const session = store.sessions.find((entry) => entry.sessionId === sessionId);

    if (!session) {
      response.status(204).send();
      return;
    }

    session.logoutAt = logoutAt;
    store.meta.updatedAt = new Date().toISOString();

    await writeStore(store);
    response.status(204).send();
  } catch (error) {
    console.error('Error closing session:', error);
    response.status(204).send();
  }
});

app.post('/api/screen-visits', async (request, response, next) => {
  try {
    const sessionId = Number(request.body?.sessionId);
    const screenName = String(request.body?.screenName ?? '').trim();
    const category = String(request.body?.category ?? '').trim();
    const enteredAt = String(request.body?.enteredAt ?? '').trim() || new Date().toISOString();

    if (!Number.isInteger(sessionId) || !screenName || !category) {
      response.status(400).json({ message: 'sessionId, screenName and category are required.' });
      return;
    }

    const store = await readStore();
    const session = store.sessions.find((entry) => entry.sessionId === sessionId);

    if (!session) {
      response.status(404).json({ message: 'Session not found.' });
      return;
    }

    const visit = {
      visitId: store.meta.nextVisitId,
      screenName,
      category,
      enteredAt,
      leftAt: null,
      clickedProducts: []
    };

    store.meta.nextVisitId += 1;
    store.meta.updatedAt = new Date().toISOString();
    session.screenVisits.push(visit);

    await writeStore(store);
    response.status(201).json(visit);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/screen-visits/:visitId/product-click', async (request, response, next) => {
  try {
    const visitId = Number(request.params.visitId);
    const productName = String(request.body?.productName ?? '').trim();

    if (!productName) {
      response.status(400).json({ message: 'productName is required.' });
      return;
    }

    const store = await readStore();
    const visit = findVisitById(store, visitId);

    if (!visit) {
      response.status(404).json({ message: 'Screen visit not found.' });
      return;
    }

    if (!visit.clickedProducts.includes(productName)) {
      visit.clickedProducts.push(productName);
    }

    store.meta.updatedAt = new Date().toISOString();
    await writeStore(store);
    response.json(visit);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/screen-visits/:visitId/exit', async (request, response, next) => {
  try {
    const visitId = Number(request.params.visitId);
    const leftAt = String(request.body?.leftAt ?? '').trim() || new Date().toISOString();
    const store = await readStore();
    const visit = findVisitById(store, visitId);

    if (!visit) {
      response.status(404).json({ message: 'Screen visit not found.' });
      return;
    }

    visit.leftAt = leftAt;
    store.meta.updatedAt = new Date().toISOString();

    await writeStore(store);
    response.json(visit);
  } catch (error) {
    next(error);
  }
});

app.post('/api/screen-visits/:visitId/exit', async (request, response, next) => {
  try {
    const visitId = Number(request.params.visitId);
    const leftAt = String(request.body?.leftAt ?? '').trim() || new Date().toISOString();
    const store = await readStore();
    const visit = findVisitById(store, visitId);

    if (!visit) {
      response.status(204).send();
      return;
    }

    visit.leftAt = leftAt;
    store.meta.updatedAt = new Date().toISOString();

    await writeStore(store);
    response.status(204).send();
  } catch (error) {
    console.error('Error closing screen visit:', error);
    response.status(204).send();
  }
});

app.get(/^(?!\/api).*/, async (request, response, next) => {
  try {
    const indexPath = path.join(distDirectory, 'index.html');
    await fs.access(indexPath);
    response.sendFile(indexPath);
  } catch {
    next();
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: 'Internal server error.' });
});

startServer().catch((error) => {
  console.error('Server startup failed.', error);
  process.exitCode = 1;
});

async function startServer() {
  await ensureDataFile();

  app.listen(port, () => {
    console.log(`Session tracker API is running on http://localhost:${port}`);
  });
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await writeStore(createDefaultStore());
  }
}

async function readStore() {
  await ensureDataFile();
  const rawContent = await fs.readFile(dataFilePath, 'utf8');
  return normalizeStore(JSON.parse(rawContent));
}

async function writeStore(store) {
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2));
}

function createDefaultStore() {
  return {
    meta: {
      nextSessionId: 1,
      nextVisitId: 1,
      updatedAt: null
    },
    sessions: []
  };
}

function normalizeStore(store) {
  const sessions = Array.isArray(store.sessions)
    ? store.sessions.map((session) => ({
        sessionId: Number(session.sessionId),
        identifier: String(session.identifier ?? ''),
        loginAt: String(session.loginAt ?? ''),
        logoutAt: session.logoutAt ?? null,
        screenVisits: Array.isArray(session.screenVisits)
          ? session.screenVisits.map((visit) => normalizeVisit(visit))
          : []
      }))
    : [];

  if (Array.isArray(store.screenVisits)) {
    for (const legacyVisit of store.screenVisits) {
      const session = sessions.find((entry) => entry.sessionId === Number(legacyVisit.sessionId));

      if (session) {
        session.screenVisits.push(normalizeVisit(legacyVisit));
      }
    }
  }

  return {
    meta: {
      nextSessionId: Number(store.meta?.nextSessionId ?? 1),
      nextVisitId: Number(store.meta?.nextVisitId ?? 1),
      updatedAt: store.meta?.updatedAt ?? null
    },
    sessions
  };
}

function normalizeVisit(visit) {
  return {
    visitId: Number(visit.visitId),
    screenName: String(visit.screenName ?? ''),
    category: String(visit.category ?? visit.screenName ?? ''),
    enteredAt: String(visit.enteredAt ?? ''),
    leftAt: visit.leftAt ?? null,
    clickedProducts: Array.isArray(visit.clickedProducts)
      ? visit.clickedProducts.map((product) => String(product)).filter(Boolean)
      : []
  };
}

function findVisitById(store, visitId) {
  for (const session of store.sessions) {
    const visit = session.screenVisits.find((entry) => entry.visitId === visitId);

    if (visit) {
      return visit;
    }
  }

  return null;
}

function createDownloadFileName(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `activity-log-${year}-${month}-${day}.json`;
}