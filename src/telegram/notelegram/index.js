import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { fromTelegram, addMember, removeMember } from './gobetween';
import { init } from '../../util/db.service';

const telegram = getBot(process.env.SMS_TELEGRAM_TOKEN, 'No Telegram');

init().then( success => {
  if (success) {
    require('./server.js');

    Logger.info('Started No Telegram Telegram bot.');

    telegram.on("text", async (message) => {
      const { chat: { id: cid, title }, text, from: { first_name: firstName, last_name: lastName, username } } = message;
      const messageToSend = `${firstName} ${lastName}: ${text}`;
      Logger.info(messageToSend);
      if (text.length > 1 && text[0] === "/") {
        if (username != 'svendog') return telegram.sendMessage(cid, `Sorry only svendog can give me commands.`);
        const fullCommand = text.substring(1);
        const split = fullCommand.split(' ');
        const command = split[0].toLowerCase();
        const args = split.splice(1);
        Logger.info(`Received command from ${firstName} ${lastName} (${cid}): ${fullCommand}`);
        if (command === 'subscribe') {
          const [name, number] = args;
          if (!name) return telegram.sendMessage(cid, `Enter the person's name followed by the number. Please.`);
          if (!/[A-z]/.test(name)) return telegram.sendMessage(cid, `Don't use any stupid characters for the name.`);
          if (!number) return telegram.sendMessage(cid, `Tell me what ${name}'s freakin' number is. I don't just magically know it.`);
          if (!/[0-9]{10}/.test(number)) return telegram.sendMessage(cid, `${number} isn't 10 digits, dummy.`);
          const ret = await addMember(name, number, cid, message.chat.title, `${firstName} ${lastName}`, title);
          if (ret) telegram.sendMessage(cid, ret);
        }
        if (command === 'unsubscribe') {
          const [number] = args;
          if (!number) return telegram.sendMessage(cid, `Tell me what ${name}'s freakin' number is. I don't just magically know it.`);
          if (!/[0-9]{10}/.test(number)) return telegram.sendMessage(cid, `${number} isn't 10 digits, dummy.`);
          const ret = await removeMember(number, message.chat.title, `${firstName} ${lastName}`);
          if (ret) telegram.sendMessage(cid, ret);
        }
      } else {
        fromTelegram(cid, messageToSend);
      }
    });
  }

  else {
    Logger.error("Error connecting to database.");
  }
});

export const sendTelegram = (cid, message) => {
  telegram.sendMessage(cid, message);
} 
