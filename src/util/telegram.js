import TelegramBot from 'node-telegram-bot-api';
import Logger from './logger';

let telegramBots = new Map();

const getBot = (token, use) => {
  const bot = telegramBots.get(token);
  if (bot) {
    Logger.info(`Returning existing bot for ${use}.`);
    return bot;
  }
  Logger.info(`Creating new bot for ${use}.`);
  telegramBots.set(token, new TelegramBot(token, { polling: true }));
  return telegramBots.get(token);
}

export { getBot };