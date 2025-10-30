import { buildApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './libs/logger.js';


const { httpServer } = await buildApp();


httpServer.listen(config.port, () => {
logger.info(`Server listening on http://localhost:${config.port}`);
});