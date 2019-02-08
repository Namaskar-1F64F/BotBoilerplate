import Logger from '../../util/Logger';
import { getSubscription, getSubscriptions, addSubscription, removeSubscription } from './database';
import { checkWebsite } from './diplomacy';

let intervals = {}; // Store intervals which can be later stopped by the /stop command

export const add = async (cid, gid) => {
  try {
    if (await getSubscription(cid) == null) {
      return await addSubscription(cid, gid);
    }
  }
  catch (err) {
    Logger.error(`Tried to add game with ID ${gid} for chat ${cid}, but got an error: ${err}`);
  }
  return false;
};

export const start = async (cid, gid) => {
  checkWebsite(cid, gid);
  intervals[cid] = setInterval(function () {
    checkWebsite(cid, gid);
  }, process.env.REFRESH_INTERVAL_MINUTES * 60 * 1000);
}

export const stop = (cid) => {
  clearInterval(intervals[cid]);
  removeSubscription(cid);
};

export const init = async () => {
  const subscriptions = await getSubscriptions();
  if (subscriptions) {
    const slice = (process.env.REFRESH_INTERVAL_MINUTES * 60 * 1000) / subscriptions.length;
    subscriptions.forEach((subscription, idx) => {
      const { cid, gid } = subscription;
      const interval = slice * idx;
      Logger.info(`Auto starting game ${cid} for chat ${gid} at time t+${interval}`);
      setTimeout(start, interval, cid, gid);
    });
  }
}
