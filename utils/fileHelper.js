import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

const taskFilePath = path.join(__dirname, '../db/tasks.json')
const userFilePath = path.join(__dirname, '../db/users.json')

const readTasks = async () => {
  const data = await fs.readFile(taskFilePath, "utf-8")
  return JSON.parse(data);
}

const readUsers = async () => {
  const data = await fs.readFile(userFilePath, "utf-8")
  return JSON.parse(data);
}

const writeTasks = async (tasks) => {
  await fs.writeFile(taskFilePath, JSON.stringify(tasks, null, 2))
}

const writeUsers = async (users) => {
  await fs.writeFile(userFilePath, JSON.stringify(users, null, 2))
}

export { readTasks, readUsers, writeTasks, writeUsers }