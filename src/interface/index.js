import Logger from '../util/logger';
import { sendDiscordMessage } from './discord';
import { sendTelegramMessage } from './telegram';
import { EventEmitter } from 'events';

export class InterfaceEmitter extends EventEmitter {
  constructor() {
    super();
  }

  receiveDiscordMessage(connection, text) {
    Logger.info(`Emit discord event.`);
    this.emit('discordMessage', connection, text);
  }
  receiveTelegramMessage(connection, text) {
    Logger.info(`Emit telegram event.`);
    this.emit('telegramMessage', connection, text);
  }
}

const interfaceEmitter = new interfaceEmitter();

export const sendMessage = (connection, text, options) => {
  connection.connections.forEach(connection => {
    if (connection.discord != null) {
      Logger.info(`Send discord message.`);
      sendDiscordMessage(connection, { text }, options);
    }
    if (connection.telegram != null) {
      Logger.info(`Send discord message.`);
      sendTelegramMessage(connection, { text }, options);
    }
  });
}

export const receiveMessage = (connection, message) => {
  connection.connections.forEach(connection => {
    if (connection.discord != null) {
      Logger.info(`Emit discord event.`);
      interfaceEmitter.receiveDiscordMessage(connection, message);
    }
    if (connection.telegram != null) {
      Logger.info(`Emit telegram event.`);
      interfaceEmitter.receiveTelegramMessage(connection, message);
    }
  });
}