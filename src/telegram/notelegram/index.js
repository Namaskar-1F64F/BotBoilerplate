import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { fromTelegram, addMember, removeMember } from './gobetween';

require('./server.js');

Logger.info('Started No Telegram Telegram bot.');
const telegram = getBot(process.env.SMS_TELEGRAM_TOKEN, 'No Telegram');

try {
  telegram.on("text", async (message) => {
    const cid = message.chat.id;
    const firstName = message.from.first_name;
    const lastName = message.from.last_name;
    const { chat: { title } } = message;
    const { text } = message;
    const messageToSend = `New message from ${firstName} ${lastName} in ${title}:
${text}`;
    Logger.info(messageToSend);
    if (text.length > 1 && text[0] === "/") {
      const fullCommand = text.substring(1);
      const split = fullCommand.split(' ');
      const command = split[0].toLowerCase();
      const args = split.splice(1);
      Logger.info(`Received command from ${cid} ${command}`);
      Logger.info(`Command ${command} detected`);
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
} catch (error) {
  Logger.error(`notelegram index.js  ${error}`);
}

export const sendTelegram = (cid, message) => {
  telegram.sendMessage(cid, message);
} 
