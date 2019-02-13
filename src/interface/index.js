import Logger from '../util/logger';
import { sendDiscordMessage } from './discord';
import { sendTelegramMessage } from './telegram';
import { EventEmitter } from 'events';
import { loadConnection, saveConnection } from './connection';

class InterfaceEmitter extends EventEmitter {
  constructor() {
    super();
  }

  receiveMessage(connection, message) {
    Logger.info(`Emit message event.`);
    this.emit('message', connection.id, message);
  }
}

export const interfaceEmitter = new InterfaceEmitter();

export const sendMessage = async (id, text, options) => {
  const connection = await loadConnection(id);
  if (connection != null && connection.type == 'discord') {
    Logger.info(`Send discord message.`);
    sendDiscordMessage(connection, { text }, options);
  }
  else if (connection != null && connection.type == 'telegram') {
    Logger.info(`Send telegram message.`);
    sendTelegramMessage(connection, { text }, options);
  }
}

export const receiveMessage = async (connection, message) => {
  const success = await saveConnection(connection);
  Logger.info('Receive Message');
  if (success) {
    Logger.info(`Emit message event.`);
    interfaceEmitter.receiveMessage(connection, message);
  }
}