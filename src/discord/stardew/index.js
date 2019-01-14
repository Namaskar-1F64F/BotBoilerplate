import Discord from 'discord.js';
import Logger from '../../util/logger';
import Find from 'find-process';
import RandExp from 'randexp';
import * as fs from 'fs';
import moment from 'moment';

const bot = new Discord.Client();
let shouldSwitch = moment().format('HH') >= 12;
let shouldSwitchBack = moment().format('HH') <= 11;
let hasSwitchedBack = false;
let hasSwitched = false;
const am = () => {
  shouldSwitch = moment().format('HH') >= 12;
  shouldSwitchBack = moment().format('HH') <= 11;
  if (shouldSwitch && !hasSwitched) {    
    const channels = bot.channels;
    const amChannel = channels.find(channel => channel.name == "AM Gamer Boys");
    if (amChannel.members.array().length <= 0) hasSwitched = true;
    else {
      hasSwitched = true;
      const channels = bot.channels;
      const amChannel = channels.find(channel => channel.name == "AM Gamer Boys");
      const peasChannel = channels.find(channel => channel.id == "98564433957122048");
      const weekendChannel = channels.find(channel => channel.name == "Weekend Gamer Boys");
      amChannel.members.every(member => member.setVoiceChannel(weekendChannel).catch(Logger.error));
      amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': false }).catch(Logger.error);
      bot.guilds.first().channels.find(channel => channel.id == '98564433957122048').send('Welcome to the PM');
    }
  } else if (shouldSwitchBack && !hasSwitchedBack) {
    const channels = bot.channels;
    const amChannel = channels.find(channel => channel.name == "AM Gamer Boys");
    hasSwitchedBack = true;
    amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': true }).catch(Logger.error);
  }
}
const update = () => {
  am();
  Find('name', 'StardewModdingAPI.exe').then((list) => {
    if (list.length >= 1) {
      bot.user.setStatus('online');
      fs.readFile(process.env.ONLINE_PLAYERS_DIRECTORY, 'utf8', function (err, players) {
        if (err) Logger.error(`stardew discord ${err}`);
        bot.user.setActivity(`${players === 0 ? 'No' : players} ${players === 1 ? 'farmer' : 'farmers'} online!`, { type: "PLAYING" })
      });
    }
    else {
      bot.user.setStatus('dnd')
      bot.user.setActivity('Server Offline', { type: "PLAYING" })
    }

  });
}
try {
  bot.on('message', function (message) {
    if (message.author.bot) return;
    Logger.info(`${message.author} sent a message "${message}" to ${message.channel}`);
    const hexExp = /[0-9a-f]{8}/;
    if (message.content.length == 8 && hexExp.test(message.content) || message.content == '!smashcode') {
      const code = new RandExp(hexExp).gen();
      Logger.info(`Sending ${code} to ${message.channel}`)
      message.channel.send(code).catch(Logger.error);
    }
    if (message.channel.type === "dm" && message.content == '!stardew') {
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
  Logger.info('Started Stardew Valley Discord Bot.');
  bot.login(process.env.STARDEW_DISCORD_TOKEN);
} catch (error) {
  Logger.error(`stardew discord ${err}`);
}