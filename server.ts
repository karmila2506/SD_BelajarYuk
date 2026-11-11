import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import generateTaskHandler from './api/generate-task.ts';
import generateMaterialHandler from './api/generate-material.ts';
import autoGradeHandler from './api/auto-grade.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for AI Task Generation
  app.all('/api/generate-task', async (req, res) => {
    try {
      await generateTaskHandler(req, res);
    } catch (err: any) {
      console.error('Server error in /api/generate-task:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal server error' });
      }
    }
  });

  // API endpoint for AI Material Generation
  app.all('/api/generate-material', async (req, res) => {
    try {
      await generateMaterialHandler(req, res);
    } catch (err: any) {
      console.error('Server error in /api/generate-material:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal server error' });
      }
    }
  });

  // API endpoint for Auto Grading (including AI essay evaluation)
  app.all('/api/auto-grade', async (req, res) => {
    try {
      await autoGradeHandler(req, res);
    } catch (err: any) {
      console.error('Server error in /api/auto-grade:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal server error' });
      }
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 BelajarYuk server active on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
