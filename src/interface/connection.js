import { MongoClient } from 'mongodb';
import Logger from '../../util/logger';

export const initialize = async () => {
  try {
    mongoClient = await MongoClient.connect(process.env.MONGO_CONNECTION_STRING, { useNewUrlParser: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

const getCollection = (collection = 'Connection') => {
  return mongoClient.db('Interface').collection(collection);
}

export const saveConnection = async (connection) => {
  try {
    const { id } = connection;
    if (id == null) return false;
    id = String(id);
    Logger.info(`DB: saveConnection with id ${id}.`);
    await getCollection().updateOne({ id }, { $set: { id, ...connection } }, { upsert: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

export const loadConnection = async (connection) => {
  try {
    const { id } = connection;
    if (id == null) return null;
    id = String(id);
    Logger.info(`DB: loadConnection with id ${id}.`);
    const connection = await getCollection().findOne({ id });
    Logger.info(JSON.stringify(connection));
    if (connection) return connection;
    Logger.error(`Could not find connection with id ${id}`);
    return null;
  } catch (error) {
    Logger.error(error);
    return null;
  }
}