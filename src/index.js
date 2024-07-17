import { initMongoConnection } from './db/initMongoConnection.js';
import { stetupServer } from './server.js';

const bootstrap = async () => {
  await initMongoConnection();
  stetupServer();
};

bootstrap();
