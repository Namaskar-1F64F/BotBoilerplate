import Logger from '../../util/logger';
import * as fs from 'fs';

const getPreviousState = (cid) => {
  Logger.info(`Getting previous state for user ${cid}`);
  let previousState = {};
  try {  // get previous state from file
    const json = fs.readFileSync(`./${cid}.json`).toString();
    previousState[cid] = JSON.parse(json);
    Logger.info(`Successfully loaded file`);
  }
  catch (err) { // if there is an error, start with a blank template
    Logger.error(err);
    Logger.warn("File not found. Starting from scratch.");
    // Plaintext messages
    previousState[cid] = {};
    // Hashed message objects
    previousState[cid].hashedMessages = {};
    // Game year
    previousState[cid].year = "";
    previousState[cid].phase = "";
    // Object to store individual country status
    previousState[cid].readyStates = {};
    previousState[cid].readyStates.countries = {};
    previousState[cid].readyStates.readyCount = 0;
    previousState[cid].initialRun = true;
  }
  return previousState;
}
const getCurrentState = () => {
  var currentState = {};
  currentState.messages = [];
  currentState.hashedMessages = {};
  currentState.year = "";
  currentState.phase = "";
  currentState.readyStates = {};
  currentState.readyStates.countries = {};
  currentState.readyStates.readyCount = 0;
  return currentState;
}


export { getPreviousState, getCurrentState };