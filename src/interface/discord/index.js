
import Discord from 'discord.js';
import Logger from '../../util/logger';
import { receiveMessage } from '..';

const bot = new Discord.Client();

Logger.info('Starting sven Discord Bot.');
bot.login(process.env.TEST_DISCORD_TOKEN);
Logger.info('Started sven succesfully.');

export const sendDiscordMessage = ({ discord }, { text }) => {
  if (discord.id != null && discord.channel == null) {
    const channel = bot.channels.find(channel => channel.id == discord.id);
    if (channel == null) throw new Error(`No channel found with ID ${discord.id}`);
    discord.channel = channel;
    channel.send(text).catch(Logger.error);
  }
}

bot.on('message', function (message) {
  if (message.author.bot) return;
  const { channel: { name: title }, cleanContent: text, author: { username } } = message;
  Logger.info(`${message.author} sent a message "${message}" to ${message.channel}`);
  const message = new Message({ title, text, username, firstName, lastName });
  const connection = new Connection({ discord: { id } });
  receiveMessage(connection, message);
});