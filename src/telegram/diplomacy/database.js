import { MongoClient } from 'mongodb';
import Logger from '../../util/logger';

let mongoClient;

export const initialize = async () => {
  try {
    mongoClient = await MongoClient.connect(process.env.MONGO_CONNECTION_STRING, { useNewUrlParser: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

const getCollection = (collection = 'Game') => {
  return mongoClient.db('Diplomacy').collection(collection);
}

export const saveGame = async (cid, game) => {
  try {
    if (cid == null || game == null) return false;
    cid = String(cid);
    Logger.info(`DB: setGame with chat ID ${cid}.`);
    await getCollection().updateOne({ cid }, { $set: { cid, ...game } }, { upsert: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

export const loadGame = async (cid) => {
  try {
    cid = String(cid);
    Logger.info(`DB: getGame with cid ${cid}.`);
    const game = await getCollection().findOne({ cid });
    Logger.info(JSON.stringify(game));
    if (game) return game;
    Logger.error(`Could not find member with cid ${cid}`);
    return null;
  } catch (error) {
    Logger.error(error);
    return null;
  }
}

export const removeGame = async (cid) => {
  try {
    cid = String(cid);
    Logger.info(`DB: removeGame with cid ${cid}.`);
    await getCollection().remove({ cid });
    return true
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}

export const addSubscription = async (cid, gid) => {
  try {
    if (cid == null || gid == null) return false;
    cid = String(cid);
    Logger.info(`DB: addSubscription with chat ID ${cid}.`);
    await getCollection('Subscription').updateOne({ cid }, { $set: { cid, gid } }, { upsert: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

export const getSubscription = async (cid) => {
  try {
    cid = String(cid);
    Logger.info(`DB: getSubscription with cid ${cid}.`);
    const subscription = await getCollection('Subscription').findOne({ cid });
    Logger.info(JSON.stringify(subscription));
    if (subscription) return subscription;
    Logger.error(`Could not find subscription with cid ${cid}`);
    return null;
  } catch (error) {
    Logger.error(error);
    return null;
  }
}

export const getSubscriptions = async () => {
  try {
    Logger.info(`DB: getSubscriptions.`);
    const subscriptions = await getCollection('Subscription').find().toArray();
    if (subscriptions) return subscriptions;
    Logger.error(`Could not find subscriptions.`);
    return null;
  } catch (error) {
    Logger.error(error);
    return null;
  }
}

export const removeSubscription = async (cid) => {
  try {
    cid = String(cid);
    Logger.info(`DB: removeSubscription with cid ${cid}.`);
    await getCollection('Subscription').remove({ cid });
    return true
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}