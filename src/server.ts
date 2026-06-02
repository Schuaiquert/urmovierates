import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

start();