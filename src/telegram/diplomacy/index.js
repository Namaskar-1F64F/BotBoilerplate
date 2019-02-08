import Logger from '../../util/logger';
import TelegramBot from 'node-telegram-bot-api';
import { init, add, stop } from './subscription';
import { initialize } from './database';

let telegram;

initialize().then(async success => {
  if (success) {
    telegram = new TelegramBot(process.env.DIPLOMACY_TELEGRAM_TOKEN, { polling: true });
    init();
    Logger.info('Started WebDiplomacy Telegram Bot.');

    telegram.on("text", async (message) => {
      const { chat: { id: cid, title }, text, from: { first_name: firstName, last_name: lastName, username } } = message;
      if (text.length > 1 && text[0] === "/") {
        const fullCommand = text.substring(1);
        const split = fullCommand.split(' ');
        const command = split[0].toLowerCase();
        const args = split.splice(1);
        Logger.info(`Received command from ${username} (${firstName} ${lastName}) in chat ${title} (${cid}): ${fullCommand}`);
        commandHandler(command, args, { cid, title, firstName, lastName });
      }
    });

    const commandHandler = (command, args, context) => {
      if (command == null) {
        return;
      } else if (command == 'monitor') {
        const [gid] = args;
        monitorCommand({ ...context, gid });
      } else if (command == 'unsubscribe') {
        const [number] = args;
        stopCommand({ ...context, number });
      } else if (command == 'start' || command == 'help') {
        const [number] = args;
        helpCommand({ ...context, number });
      }
    }

    const monitorCommand = ({ gid, cid }) => {
      if (gid == null) {
        const message = `I can't monitor everything, ha!\n\`/monitor <Your game ID goes here, dummy>\``;
        Logger.verbose(message);
        telegram.sendMessage(cid, message, { parse_mode: 'Markdown' });
        return;
      }
      add(cid, gid);
    }

    const stopCommand = ({ cid }) => {
      stop(cid);
    }

    const helpCommand = ({ cid }) => {
      const message = `*Check me out! I'm the Web Diplomacy bot!*

To get started, locate the  \`gameID\` (found in the URL of a webDiplomacy game) you want to monitor and send me the

\`/monitor <GAME_ID>\` command to monitor a game.

To stop monitoring, send the command

\`/stop\`.

Questions? t.me/svendog`;
      Logger.verbose(message);
      telegram.sendMessage(cid, message, { parse_mode: "Markdown" });
    }
  }
});

export const sendTelegramMessage = (cid, message, options) => {
  Logger.verbose(`Sending Telegram message to chat ${cid}.`);
  telegram.sendMessage(cid, message, options);
}

export const sendTelegramPhoto = (cid, url, options) => {
  Logger.verbose(`Sending Telegram photo to chat ${cid}.`);
  telegram.sendPhoto(cid, url, options);

}
