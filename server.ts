import { createServer } from 'http';
import dotenv from 'dotenv';
import { routeRequest } from './controllers/index.js';
dotenv.config({ path: './config.env' });

const server = createServer(routeRequest);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});
