import { app } from './app';
import { ENV } from './config/env';

const server = app.listen(ENV.PORT, () => {
  console.log('====================================================');
  console.log(`🛡️  SoundGrid Sentinel Core Backend running on port ${ENV.PORT}`);
  console.log(`📡 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔐 Identity & RBAC Layer: ACTIVE`);
  console.log(`⚡ Database Connection: PostgreSQL 18 (127.0.0.1:5433)`);
  console.log('====================================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
