import Discord from 'discord.js';
import Logger from '../../util/logger';
import moment from 'moment';

if (process.env.DISCORD_TEXT_CHANNEL_ID == null || process.env.DISCORD_AM_CHANNEL_ID == null || process.env.DISCORD_AFK_CHANNEL_ID == null)
  throw 'Add DISCORD_TEXT_CHANNEL_ID, DISCORD_AM_CHANNEL_ID, and DISCORD_AFK_CHANNEL_ID to your environment, please.';

const bot = new Discord.Client();

let amChannel, channels, hasSwitchedBack = false, hasSwitched = false;

const closeGate = () => gate(false);
const openGate = () => gate(true);
const gate = (open) => {
  amChannel.overwritePermissions(bot.guilds.first().roles.find(role => role.name == '@everyone'), { 'CONNECT': open }).catch(Logger.error);
}
const am = () => {
  if (moment().format('HH') >= 12 && !hasSwitched) {
    hasSwitched = true;
    hasSwitchedBack = false;
    if (amChannel.members.array().length <= 0) {
      Logger.info('Thought about moving members from the AM channel, but it appears there are none to move!');
      closeGate();
    }
    else {
      Logger.info('People in AM channel when they should not be!');
      const emptyChannel = channels.find(channel => channel.id != process.env.DISCORD_AM_CHANNEL_ID && channel.id != process.env.DISCORD_AFK_CHANNEL_ID && channel.members.size === 0)
      let channelToSwitch = emptyChannel;
      if (!emptyChannel) {
        channelToSwitch = channels.find(channel => channel.id == process.env.DISCORD_TEXT_CHANNEL_ID);
      }
      Logger.info('Kicking them out!');
      amChannel.members.every(member => member.setVoiceChannel(channelToSwitch).catch(Logger.error));
      closeGate();
      bot.guilds.first().channels.find(channel => channel.id == process.env.DISCORD_AM_CHANNEL_ID).send('Out with ye!');
    }
  } else if (moment().format('HH') <= 11 && !hasSwitchedBack) {
    Logger.info('Letting people back in AM channel because technically they should be allowed');
    hasSwitchedBack = true;
    hasSwitched = false;
    openGate();
  }
}

bot.on("ready", () => {
  channels = bot.channels;
  amChannel = channels.find(channel => channel.id == process.env.DISCORD_AM_CHANNEL_ID);
  if (amChannel != null) {
    setInterval(am, 30000);
  } else {
    Logger.error('No AM channel, no gatekeeping.');
  }
});

bot.on("error", Logger.error);

Logger.info('Starting AM Gatekeeper Discord Bot.');
bot.login(process.env.AM_DISCORD_TOKEN);
Logger.info('Started AM Gatekeeper succesfully.');