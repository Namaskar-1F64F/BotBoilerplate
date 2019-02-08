import Logger from '../../util/logger';
import { loadGame, saveGame } from './database';

class Game {
  hashedMessages = {};
  messages = [];
  year = '';
  phase = '';
  readyStates = {
    countries: {},
    readyCount: 0
  };
  initialRun = true
}

const getPreviousState = async (cid) => {
  Logger.info(`Getting previous state for user ${cid}`);
  const game = await loadGame(cid);
  if (game == null) {
    saveGame(cid, new Game());
    return new Game();
  }
  return game;
}
const getCurrentState = () => {
  return new Game();
}


export { getPreviousState, getCurrentState };