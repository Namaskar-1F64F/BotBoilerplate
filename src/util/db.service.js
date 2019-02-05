import { MongoClient } from 'mongodb';
import Logger from './logger';

let mongoClient;

export const init = async () => {
  try {
    mongoClient = await MongoClient.connect(process.env.MONGO_CONNECTION_STRING);
    return true;
  } catch (error) {
    Logger.error(error);
  }
}

export const getAllByChat = async (chatId) => {
  const collection = mongoClient.db('Forward').collection('People');

  return new Promise((resolve, reject) => {
    collection.find({ chatId }).toArray((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

export const getMember = async (number) => {
  const collection = mongoClient.db('Forward').collection('People');

  return new Promise((resolve) => {
    resolve(collection.findOne({ number }));
  });
}

export const storeMember = async (memberDocument) => {
  const collection = mongoClient.db('Forward').collection('People');

  return new Promise((resolve) => {
    collection.insertOne(memberDocument).then(writeResult => {
      resolve(writeResult);
    });
  });
}
