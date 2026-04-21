import 'dotenv/config';
import express from 'express';
import { initDb } from './db/schema';
import { closeDriver } from './db/neo4j';
import usersRouter from './api/users/route';
import skillsRouter from './api/skills/route';

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

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server after DB is ready
async function start(): Promise<void> {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`SkillGraph API running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[${signal}] Shutting down...`);
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

start();

export default app;
