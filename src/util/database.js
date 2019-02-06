import { MongoClient } from 'mongodb';
import Logger from './logger';

let mongoClient;

export const init = async () => {
  try {
    mongoClient = await MongoClient.connect(process.env.MONGO_CONNECTION_STRING, { useNewUrlParser: true });
    return true;
  } catch (error) {
    Logger.error(error);
    return false;
  }
}

const getCollection = (collection = 'People') => {
  return mongoClient.db('Forward').collection(collection);
}

export const getMembers = async (cid) => {
  try {
    if (cid == null) return [];
    cid = String(cid);
    Logger.info(`DB: getAllByChat with chat ID ${cid}.`);
    return await getCollection().find({ cid, active: true }).toArray();
  } catch (error) {
    Logger.error(error);
    return [];
  }
}

export const getMember = async (number) => {
  try {
    number = String(number);
    Logger.info(`DB: getMember with number ${number}.`);
    const member = await getCollection().findOne({ number });
    Logger.info(member);
    if (member) return member;
    Logger.error(`Could not find member with number ${number}`);
    return null;
  } catch (error) {
    Logger.error(error);
    return null;
  }
}

export const verifyMember = async (number) => {
  try {
    number = String(number);
    Logger.info(`DB: verifyMember with number ${number}.`);
    await getCollection().updateOne({ number }, { $set: { verified: true } });
    return true
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}

export const reactivateMember = async (number, cid) => {
  try {
    number = String(number);
    cid = String(cid);
    Logger.info(`DB: reactivateMember with number ${number}.`);
    await getCollection().updateOne({ number }, { $set: { cid, verified: false, active: true } });
    return true
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}

export const removeMember = async (number) => {
  try {
    number = String(number);
    Logger.info(`DB: removeMember with number ${number}.`);
    await getCollection().updateOne({ number }, { $set: { active: false } });
    return true
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}

export const createMember = async ({ cid, name, number }) => {
  try {
    cid = String(cid);
    number = String(number);
    const oldMember = await getMember(number);
    if (oldMember != null) {
      Logger.info(`Member with number ${number} already exists`);
      return false;
    }
    const member = { cid, name, number, verified: false, active: true }
    Logger.info(`DB: createMember ${JSON.stringify(member)}.`);
    await getCollection().insertOne(member);
    return true;
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}


export const updateMember = async ({ cid, name, number, verified, active }) => {
  try {
    const member = { cid, name, number, verified, active }
    Logger.info(`DB: storeMember ${JSON.stringify(member)}.`);
    await getCollection().updateOne({ number }, { $set: member }, { upsert: true })
    return true;
  }
  catch (error) {
    Logger.error(error);
    return false;
  }
}
