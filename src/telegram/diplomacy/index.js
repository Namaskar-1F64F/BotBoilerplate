import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { init, start, stop } from './subscription';

const telegram = getBot(process.env.DIPLOMACY_TELEGRAM_TOKEN, "WebDiplomacy");
init();
Logger.info('Started WebDiplomacy Telegram Bot.');

telegram.on("text", function (message) {
  const cid = message.chat.id; // use chat id because it is unique to individual chats
  const { text } = message;
  const command = text.toLowerCase();
  Logger.info(`Received command from ${cid} ${command}`);
  if (command.indexOf("/monitor") === 0) { // given monitor message
    var split = message.text.split(' ');
    if (split.length == 1) {
      const message = `Specify a game ID
      \`/monitor gameID\``;
      Logger.verbose(message);
      telegram.sendMessage(cid, message);
      return; // don't start games for undefined id
    }
    if (split[2] != undefined) cid = split[2];
    // start subscription for specific chat
    start(cid, split[1], split[2] == undefined);
  }
  else if (command.indexOf("/stop") === 0) { // given monitor message
    stop(cid);
  }
  else if (command.indexOf("/start") === 0 || command.indexOf("/help") === 0) {
    const message = `*Welcome to webDiplomacy bot!*

    To get started, locate the  \`gameID\` (found in the URL of a webDiplomacy game) you want to
     monitor and send the \n\n \`/monitor \<GAME_ID\>\` command to monitor a game.

    To stop monitoring, send the command \`/stop\`.

    [Visit the GitHub](https://github.com/Timone/WebDiplomacyTelegramBot)`;
    Logger.verbose(message);
    telegram.sendMessage(cid, message, { parse_mode: "Markdown" });
  }
});
