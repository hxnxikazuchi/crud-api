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

const readUsersFromFile = async (): Promise<User[]> => {
  try {
    const data = await fs.readFile(USERS_FILE, { encoding: 'utf8' });
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from file:', error);
    return [];
  }
};

const writeUsersToFile = async (users: User[]): Promise<void> => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), { encoding: 'utf8' });
  } catch (error) {
    console.error('Error writing to file:', error);
  }
};

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
