import Logger from '../../util/logger';
import TelegramBot from 'node-telegram-bot-api';
import { receiveMessage } from '..';
import Message from './interfaces/message';
import Connection from './interfaces/connection';
import { loadConnection } from '../connection';

telegram = new TelegramBot(process.env.TEST_TELEGRAM_TOKEN, { polling: true });

export const sendTelegramMessage = ({ id }, { text }) => {
  telegram.sendMessage(id, text, { parse_mode: 'Markdown' });
}

telegram.on("text", async (message) => {
  const { chat: { id, title }, text, from: { first_name: firstName, last_name: lastName, username } } = message;
  const message = new Message({ title, text, username, firstName, lastName });
  const connection = new Connection({ telegram: { id } });
  receiveMessage(connection, message.text);
});