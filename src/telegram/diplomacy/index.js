import Logger from '../../util/logger';
import { init, add, stop } from './subscription';
import { initialize } from './database';
import { interfaceEmitter } from '../../interface';
import { sendMessage } from '../../interface';

initialize().then(async success => {
  if (success) {
    init();
    Logger.info('Started WebDiplomacy Telegram Bot.');

    interfaceEmitter.on("message", async (id, message) => {
      Logger.info(`Received message in diplomacy.`);
      const { text, username, title } = message;
      if (text.length > 1 && text[0] === "/") {
        const fullCommand = text.substring(1);
        const split = fullCommand.split(' ');
        const command = split[0].toLowerCase();
        const args = split.splice(1);
        Logger.info(`Received command from ${username} in chat ${title} (${id}): ${fullCommand}`);
        commandHandler(command, args, { id, title });
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

    const monitorCommand = ({ id, gid }) => {
      if (gid == null) {
        const message = `I can't monitor everything, ha!\n\`/monitor <Your game ID goes here, dummy>\``;
        Logger.verbose(message);
        sendMessage(id, message, { parse_mode: 'Markdown' });
        return;
      }
      add(id, gid);
    }

    const stopCommand = ({ id }) => {
      stop(id);
    }

    const helpCommand = ({ id }) => {
      const message = `*Check me out! I'm the Web Diplomacy bot!*

To get started, locate the  \`gameID\` (found in the URL of a webDiplomacy game) you want to monitor and send me the

\`/monitor <GAME_ID>\` command to monitor a game.

To stop monitoring, send the command

\`/stop\`.

Questions? t.me/svendog`;
      Logger.verbose(message);
      sendMessage(id, message, { parse_mode: "Markdown" });
    }
  }
});
