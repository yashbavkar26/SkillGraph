import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { initDb } from './db/schema';
import { closeDriver } from './db/neo4j';
import usersRouter from './api/users/route';
import skillsRouter from './api/skills/route';
import relationshipsRouter from './api/relationships/route';
import evidenceRouter from './api/evidence';
import endorseRouter from './api/endorse';
import recruiterSearchRouter from './api/recruiter/search';
import assessmentRouter from './api/assessment/ingest';
import { BackgroundJobRunner } from './services/reputation/backgroundJobs';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/relationships', relationshipsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/endorse', endorseRouter);
app.use('/api/recruiter', recruiterSearchRouter);
app.use('/api/assessment', assessmentRouter);

const uiBuildDirCandidates = [
  path.resolve(process.cwd(), 'dist', 'recruiter-ui'),
  path.resolve(__dirname, 'recruiter-ui'),
];
const uiBuildDir = uiBuildDirCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'index.html'))
);
const uiIndexPath = uiBuildDir ? path.join(uiBuildDir, 'index.html') : '';
const hasUiBuild = Boolean(uiBuildDir);

if (hasUiBuild && uiBuildDir) {
  app.use(express.static(uiBuildDir));

  // Keep client-side routes working when the app is served by Express.
  app.get(/^\/(?!api|health).*/, (_req, res) => {
    res.sendFile(uiIndexPath);
  });
}

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server after DB is ready
export async function start(): Promise<void> {
  try {
    await initDb();
    const backgroundJobs = new BackgroundJobRunner();
    backgroundJobs.start();

    const server = app.listen(PORT, () => {
      console.log(`SkillGraph API running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[${signal}] Shutting down...`);
      backgroundJobs.stop();
      server.close(async () => {
        await closeDriver();
        console.log('Shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  void start();
}

export default app;
