
import Discord from 'discord.js';
import Logger from '../../util/logger';
import { receiveMessage } from '..';
import InterfaceMessage from '../interfaces/message';
import Connection from '../interfaces/connection';

const bot = new Discord.Client();

Logger.info('Starting discord interface.');
bot.login(process.env.DIPLOMACY_DISCORD_TOKEN);
Logger.info('Started discord interface succesfully.');

export const sendDiscordMessage = ({id}, { text }) => {
  if (id != null) {
    const channel = bot.channels.find(channel => channel.id == id);
    if (channel == null) throw new Error(`No channel found with ID ${id}`);
    channel.send(text).catch(error => Logger.error(error.stack));
  }
}

bot.on('message', function (message) {
  if (message.author.bot) return;
  const { channel: { id, name: title }, cleanContent: text, author: { username } } = message;
  Logger.info(`${message.author} sent a message "${message}" to ${message.channel}`);
  const interfaceMessage = new InterfaceMessage({ title, text, username });
  const connection = new Connection(id, 'discord');
  receiveMessage(connection, interfaceMessage);
});