import * as fs from 'fs';
import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';

Logger.info('Started Stardew Valley Telegram bot.');
const telegram = getBot(process.env.STARDEW_TELEGRAM_TOKEN, 'Stardew Valley');
try {
  telegram.on("text", (message) => {
    const cid = message.chat.id; // use chat id because it is unique to individual chats
    const { text } = message;
    const command = text.toLowerCase();
    Logger.info(`Received command from ${cid} ${command}`);
    if (command.indexOf('/stardewcode') === 0) {
      fs.readFile(process.env.INVITE_CODE_DIRECTORY, 'utf8', function (err, code) {
        if (err) throw err;
        Logger.info(`Sending code ${code} to ${cid}`);
        Logger.verbose(code);
        telegram.sendMessage(cid, code);
      });
    } else if (command.indexOf("/stardewstatus") === 0) {
      fs.readFile(process.env.ONLINE_PLAYERS_DIRECTORY, 'utf8', (err, players) => {
        if (err) throw err;
        const message = `${players === 0 ? 'No' : players} ${players === 1 ? 'farmer' : 'farmers'} online!`;
        Logger.info(`Sending number of players ${players} to ${cid}`);
        Logger.verbose(message);
        telegram.sendMessage(cid, message);
      });
    }
  });
} catch (error) {
  Logger.error(`stardew index.js  ${error}`);
}