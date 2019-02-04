import Discord from 'discord.js';
import Logger from '../../util/logger';
import moment from 'moment';

const bot = new Discord.Client();
const textChannelId = 98564433957122048;
const amChannelId = 99348835444215808;
const afkChannelId = 484529656058478603;
let amChannel;
let hasSwitchedBack = false;
let hasSwitched = false;
const am = () => {
  if (moment().format('HH') >= 12 && !hasSwitched) {
    if (amChannel.members.array().length <= 0) {
      Logger.info('Thought about moving members from the AM channel, but it appears there are none to move!');
      hasSwitched = true;
      Logger.info('Disallowing connections to AM channel');
      amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': false }).catch(Logger.error);
    }
    else {
      Logger.info('People in AM channel when they should not be!');
      hasSwitched = true;
      const channels = bot.channels;
      const emptyChannel = channels.find(channel => channel.id != amChannelId && channel.id != afkChannelId && channel.members.size === 0)
      let channelToSwitch = emptyChannel;
      if (!emptyChannel) {
        channelToSwitch = channels.find(channel => channel.id == 277904677046321162);
      }
      Logger.info('Kicking them out!');
      amChannel.members.every(member => member.setVoiceChannel(channelToSwitch).catch(Logger.error));
      amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': false }).catch(Logger.error);
      bot.guilds.first().channels.find(channel => channel.id == '98564433957122048').send('Out with ye!');
    }
  } else if (moment().format('HH') <= 11 && !hasSwitchedBack) {
    Logger.info('Letting people back in AM channel because technically they should be allowed');
    hasSwitchedBack = true;
    amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': true }).catch(Logger.error);
  }
}
bot.on("ready", () => {
  const channels = bot.channels;
  amChannel = channels.find(channel => channel.id == amChannelId);
  setInterval(am, 30000);
});
bot.on("error", Logger.error);
Logger.info('Starting AM Gatekeeper Discord Bot.');
bot.login(process.env.AM_DISCORD_TOKEN);
Logger.info('Started AM Gatekeeper succesfully.');