import Logger from '../../util/Logger';
import * as fs from 'fs'; // storing json to disk
import { getBot } from '../../util/telegram';
import { checkWebsite } from './diplomacy';
import * as path from 'path';

const telegram = getBot(process.env.DIPLOMACY_TELEGRAM_TOKEN, "WebDiplomacy");
let subscriptions = undefined; // Start with empty subscriptions object
let intervals = {}; // Store intervals which can be later stopped by the /stop command

const writeToFile = () => {
  fs.writeFileSync('subscription.json', JSON.stringify(subscriptions), "utf8");
};

const getSubscription = (cid) => {
  return subscriptions.subscribed.find(function (element) {
    return element.cid == cid;
  });
};

const addSubscription = (cid, gid) => {
  try {
    if (getSubscription(cid) == undefined) {
      subscriptions.subscribed.push({ 'gid': gid, 'cid': cid });
      writeToFile();
      return true;
    }
    else if (intervals[cid] == undefined) {
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

const start = (cid, gid, notify) => {
  if (addSubscription(cid, gid)) { // Successfully added?
    const message = `This chat is now subscribed to receive updates for game ${gid}`;
    if (notify) telegram.sendMessage(cid, );
    Logger.info("Chat %s subscribed for game %s.", cid, gid);
    // Check website for immediate checking
    checkWebsite(cid, gid);
    // Then, set an interval to check the website
    intervals[cid] = setInterval(function () {
      checkWebsite(cid, gid);
    }, 360000); // 6 minutes
  }
  else {
    Logger.warn("User %s already subscribed for chat %s", cid, intervals[cid]);
  }
};

const deleteSubscription = (cid) => {
  try {
    var match = getSubscription(cid);
    if (match != undefined) {
      var idx = subscriptions.subscribed.indexOf(match);
      if (idx != -1) {
        subscriptions.subscribed.splice(idx, 1);
        writeToFile();
      }
    }
    Logger.info("Stopped subscription for chat %s.", cid);
  }
  catch (err) {
    Logger.error(`subscription.js ${err}`);
    return false;
  }
};

const stop = (cid) => {
  clearInterval(intervals[cid]);
  deleteSubscription(cid);
};

const readFromFile = () => {
  try {
    subscriptions = fs.readFileSync('subscription.json').toString();
    return JSON.parse(subscriptions);
  }
  catch (err) {
    //Theres an error, lets create file now
    fs.writeFileSync('subscription.json', JSON.stringify({ 'subscribed': [] }), "utf8");
    Logger.error(`read from file subscription.js ${err}`);
    return { 'subscribed': [] };
  }
};

const autoStart = () => {
  // When the application stops running, intervals are cleared, we want to restart all active subscriptions
  for (var i = 0; i < subscriptions.subscribed.length; i++) {
    var cid = subscriptions.subscribed[i].cid;
    var gid = subscriptions.subscribed[i].gid;
    var sleep = (360000 / subscriptions.subscribed.length) * i;
    var notify = false;
    Logger.info("Auto starting game %s for chat %s at time t+%s", cid, gid, sleep);
    setTimeout(start, sleep, cid, gid, notify);
  }
};

const init = () => {
  subscriptions = readFromFile();
  autoStart();
};
export { init, start, stop };