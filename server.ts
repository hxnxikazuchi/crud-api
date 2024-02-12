import { createServer, IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: './config.env' });

type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

const users: User[] = [];

const sendJSON = (res: ServerResponse, statusCode: number, data: object) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const getUsers = (req: IncomingMessage, res: ServerResponse) => {
  sendJSON(res, 200, users);
};

const notFound = (req: IncomingMessage, res: ServerResponse) => {
  sendJSON(res, 404, { message: 'Resource not found' });
};

const requestListener = (req: IncomingMessage, res: ServerResponse) => {
  const { method, url } = req;

  if (url === '/api/users' && method === 'GET') {
    getUsers(req, res);
  } else {
    notFound(req, res);
  }
};

const server = createServer(requestListener);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});
