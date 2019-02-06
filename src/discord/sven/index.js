
import Discord from 'discord.js';
import Logger from '../../util/logger';
import Find from 'find-process';
import RandExp from 'randexp';
import * as fs from 'fs';

const bot = new Discord.Client();
const update = () => {
  Find('name', 'StardewModdingAPI.exe').then((list) => {
    if (list.length >= 1 && process.env.ONLINE_PLAYERS_DIRECTORY != null) {
      bot.user.setStatus('online');
      fs.readFile(process.env.ONLINE_PLAYERS_DIRECTORY, 'utf8', function (err, players) {
        if (err) Logger.error(`stardew discord ${err}`);
        bot.user.setActivity(`${players == 0 ? 'No' : players} ${players === 1 ? 'farmer' : 'farmers'} online!`, { type: "PLAYING" })
      });
    }
  });
}
bot.on('message', function (message) {
  if (message.author.bot) return;
  Logger.info(`${message.author} sent a message "${message}" to ${message.channel}`);
  const hexExp = /[0-9a-f]{8}/;
  if (message.content.length == 8 && hexExp.test(message.content) || message.content == '!smashcode') {
    const code = new RandExp(hexExp).gen();
    Logger.info(`Sending ${code} to ${message.channel}`)
    message.channel.send(code).catch(Logger.error);
  }
  if (message.channel.type === "dm" && message.content == '!stardew' && process.env.INVITE_CODE_DIRECTORY != null) {
    var fs = require('fs');
    fs.readFile(process.env.INVITE_CODE_DIRECTORY, 'utf8', (err, code) => {
      if (err) throw err;
      Logger.info(`Sending code ${code} to ${message.author.username}`);
      message.author.send(`Hey ${message.author.username}! ${code} is the code! Have fun :)`).catch(Logger.error);
    });
  }
});
bot.on("ready", () => {
  setInterval(update, 30000);
});

Logger.info('Starting sven Discord Bot.');
bot.login(process.env.SVEN_DISCORD_TOKEN);
Logger.info('Started sven succesfully.');
