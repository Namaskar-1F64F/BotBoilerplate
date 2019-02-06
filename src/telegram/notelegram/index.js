import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { fromTelegram, subscribe, unsubscribe } from './gobetween';
import { init } from '../../util/database';

Logger.info('Started No Telegram Telegram bot.');
const telegram = getBot(process.env.SMS_TELEGRAM_TOKEN, 'No Telegram');

init().then(async success => {
  if (success) {
    require('./server.js');

    telegram.on("text", async (message) => {
      const { chat: { id: cid, title }, text, from: { first_name: firstName, last_name: lastName, username } } = message;
      const messageToSend = `${firstName} ${lastName}: ${text}`;
      if (text.length > 1 && text[0] === "/") {
        if (process.env.SMS_SINGLE_USERNAME && username != process.env.SMS_ADMIN_USERNAME) return telegram.sendMessage(cid, `Sorry only ${process.env.SMS_ADMIN_USERNAME} can give me commands.`);
        const fullCommand = text.substring(1);
        const split = fullCommand.split(' ');
        const command = split[0].toLowerCase();
        const args = split.splice(1);
        Logger.info(`Received command from ${firstName} ${lastName} (${cid}): ${fullCommand}`);
        commandHandler(command, args, { cid, title, firstName, lastName });
      } else {
        fromTelegram(cid, messageToSend);
      }
    });
  } else {
    Logger.error("Error connecting to database.");
  }
});

export const sendTelegram = (cid, message) => {
  Logger.verbose(`Sending message to Telegram chat ${cid}.`);
  telegram.sendMessage(cid, message);
}

const commandHandler = (command, args, context) => {
  if (command == null) {
    return;
  } else if (command == 'subscribe') {
    const [name, number] = args;
    subscribeCommand({ ...context, name, number });
  } else if (command == 'unsubscribe') {
    const [number] = args;
    unsubscribeCommand({ ...context, number });
  } else if (command == 'help') helpCommand(context);
}

const subscribeCommand = async ({ name, number, cid, firstName, lastName, title }) => {
  if (!name) return telegram.sendMessage(cid, `Enter the person's name followed by the number. Please.`);
  if (!/[A-z]/.test(name)) return telegram.sendMessage(cid, `Don't use any stupid characters for the name.`);
  if (!number) return telegram.sendMessage(cid, `Tell me what ${name}'s freakin' number is. I don't just magically know it.`);
  if (!/[0-9]{10}/.test(number)) return telegram.sendMessage(cid, `${number} isn't 10 digits, dummy.`);
  const ret = await subscribe(name, number, cid, title, `${firstName} ${lastName}`);
  if (ret) telegram.sendMessage(cid, ret);
}

const unsubscribeCommand = async ({ number, cid, firstName, lastName, title }) => {
  if (!number) return telegram.sendMessage(cid, `Unsubscribe what? You think this is a game?`);
  if (!/[0-9]{10}/.test(number)) return telegram.sendMessage(cid, `${number} isn't 10 digits, dummy.`);
  const ret = await unsubscribe(number, title, `${firstName} ${lastName}`, cid);
  if (ret) telegram.sendMessage(cid, ret);
}

const helpCommand = ({ cid }) => {
  telegram.sendMessage(cid, `I thought you'd never ask for help!

So... I'll start with a little about me 🙃... I was created when two Nintendo Gamecubes (that had their disc covers removed) were placed on top of each other with one inverted. The resulting shockwave took down most of the US power grid, and created a few beings like me.

If you're interested in shoving someone's (SMS 🤢 ick) messages through me, say:
\`/subscribe <First Name> <Number>\`

To stop the shove, just tell me
\`/unsubscribe <Number>\`

This will only last a limited time (<2000 messages) because APIs to send texts are freakin' expensive.

Questions?
t.me/svendog`, { parse_mode: 'Markdown' });
}
