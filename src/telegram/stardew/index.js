import * as fs from 'fs';
import Logger from '../../util/logger';
import TelegramBot from 'node-telegram-bot-api';

try {
  const telegram = new TelegramBot(process.env.STARDEW_TELEGRAM_TOKEN, { polling: true });
  Logger.info('Started Stardew Valley Telegram bot.');

  telegram.on('text', (message) => {
    const { chat: { id: cid }, text } = message;
    const command = text.toLowerCase();
    Logger.info(`Received command from ${cid} ${command}.`);
    if (command.includes('stardewcode')) {
      fs.readFile(process.env.INVITE_CODE_DIRECTORY, 'utf8', (err, code) => {
        if (err) throw err;
        Logger.info(`Sending code ${code} to ${cid}.`);
        telegram.sendMessage(cid, code);
      });
    } else if (command.includes('stardewstatus')) {
      fs.readFile(process.env.ONLINE_PLAYERS_DIRECTORY, 'utf8', (err, players) => {
        if (err) throw err;
        const message = `${players === 0 ? 'No' : players} ${players === 1 ? 'farmer' : 'farmers'} online!`;
        Logger.info(`Sending number of players (${players}) to ${cid}.:\n${message}`);
        telegram.sendMessage(cid, message);
      });
    }
  });
} catch (error) {
  Logger.error(`stardew index.js\n${error}`);
}