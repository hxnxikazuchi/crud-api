import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import type { User } from '../types';

const USERS_FILE = path.join(__dirname, '/../users.json');

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

const parseBody = (req: IncomingMessage): Promise<never> => {
  return new Promise((resolve, reject) => {
    try {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(JSON.parse(body));
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getUserById = async (req: IncomingMessage, res: ServerResponse, userId: string) => {
  if (!uuidValidate(userId)) {
    return sendJSON(res, 400, { message: 'Invalid user ID format' });
  }

  const users = await readUsersFromFile();

  const user = users.find((user) => user.id === userId);
  if (!user) {
    return sendJSON(res, 404, { message: 'User not found' });
  }

  sendJSON(res, 200, user);
};

const createUser = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const userData: User = await parseBody(req);
    const { username, age, hobbies } = userData;

    if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
      return sendJSON(res, 400, { message: 'Missing required fields' });
    }
    const users = await readUsersFromFile();
    const newUser: User = { id: uuidv4(), username, age, hobbies };
    users.push(newUser);
    sendJSON(res, 201, newUser);
    await writeUsersToFile(users);
  } catch (error) {
    sendJSON(res, 500, { message: 'Error parsing request body' });
  }
};

const updateUser = async (req: IncomingMessage, res: ServerResponse, userId: string) => {
  if (!uuidValidate(userId)) {
    return sendJSON(res, 400, { message: 'Invalid user ID format' });
  }

  const users = await readUsersFromFile();

  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex === -1) {
    return sendJSON(res, 404, { message: 'User not found' });
  }

  try {
    const userData: User = await parseBody(req);
    const user = users[userIndex];
    users[userIndex] = { ...user, ...userData };
    sendJSON(res, 200, users[userIndex] as User);
    await writeUsersToFile(users);
  } catch (error) {
    sendJSON(res, 500, { message: 'Error parsing request body' });
  }
};

const deleteUser = async (req: IncomingMessage, res: ServerResponse, userId: string) => {
  if (!uuidValidate(userId)) {
    return sendJSON(res, 400, { message: 'Invalid user ID format' });
  }

  const users = await readUsersFromFile();

  const userIndex = users.findIndex((user) => user.id === userId);
  if (userIndex === -1) {
    return sendJSON(res, 404, { message: 'User not found' });
  }

  users.splice(userIndex, 1);
  await writeUsersToFile(users);
  res.writeHead(204);
  res.end();
};

const getUsers = async (req: IncomingMessage, res: ServerResponse) => {
  const users = await readUsersFromFile();
  sendJSON(res, 200, users);
};

const notFound = (req: IncomingMessage, res: ServerResponse) => {
  sendJSON(res, 404, { message: 'Resource not found' });
};

export const routeRequest = async (req: IncomingMessage, res: ServerResponse) => {
  const { method, url } = req;
  const urlParts = url?.split('/').filter((part) => part);

  if (urlParts && urlParts.length === 2 && urlParts[0] === 'api' && urlParts[1] === 'users') {
    switch (method) {
      case 'GET':
        getUsers(req, res);
        break;
      case 'POST':
        await createUser(req, res);
        break;
      default:
        notFound(req, res);
    }
  } else if (
    urlParts &&
    urlParts.length === 3 &&
    urlParts[0] === 'api' &&
    urlParts[1] === 'users'
  ) {
    const userId = urlParts[2];
    switch (method) {
      case 'GET':
        await getUserById(req, res, userId as string);
        break;
      case 'PUT':
        await updateUser(req, res, userId as string);
        break;
      case 'DELETE':
        deleteUser(req, res, userId as string);
        break;
      default:
        notFound(req, res);
    }
  } else {
    notFound(req, res);
  }
};
