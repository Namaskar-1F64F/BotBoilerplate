import Logger from '../../util/Logger';
import { getSubscription, getSubscriptions, addSubscription, removeSubscription } from './database';
import { checkWebsite } from './diplomacy';

let intervals = {}; // Store intervals which can be later stopped by the /stop command

export const add = async (cid, gid) => {
  try {
    if (await getSubscription(cid) == null) {
      await addSubscription(cid, gid);
      return true;
    }
    else {
      return false;
    }
  }
  catch (err) {
    Logger.error(`subscription.js ${err}`);
    return false;
  }
};

export const start = async (cid, gid) => {
  checkWebsite(cid, gid);
  intervals[cid] = setInterval(function () {
    checkWebsite(cid, gid);
  }, 360000);
}

export const stop = (cid) => {
  clearInterval(intervals[cid]);
  removeSubscription(cid);
};

export const init = async () => {
  const subscriptions = await getSubscriptions();
  if (subscriptions) {
    subscriptions.forEach(subscription => {
      const { cid, gid } = subscription;
      const sleep = 360000;
      Logger.info(`Auto starting game ${cid} for chat ${gid} at time t+${sleep}`, cid, gid, sleep);
      start(cid, gid);
    });
  }
}