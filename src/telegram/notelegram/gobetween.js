import Logger from '../../util/logger';
import Storage from 'node-persist';
import { sendSms, inviteSms } from './twilio';
import { sendTelegram } from './index';
import { fruits } from './fruits';
Storage.init();
class Connection {
  constructor(name, number, cid) {
    this.name = name;
    this.number = number;
    this.cid = cid;
    this.verified = false;
  }
  getIdentifier() {
    return this.number + this.name;
  }
}

export const fromTelegram = async (cid, message) => {
  Logger.info(`Recieved message sending to Twilio`);
  const connection = await getMember(cid);
  if (!connection) {
    Logger.info(`Could not find member by ${cid}.`);
    return null;
  }
  if (!connection.verified) {
    Logger.info(`${connection.name} has not verified yet.`);
    return null;
  }
  sendSms(connection.number, message);
}

export const fromSms = async (number, text) => {
  Logger.info(`Recieved message from ${number} with message ${text}`);
  const connection = await getMember(number);
  if (!connection) {
    Logger.info(`Could not find member by ${number}.`);
    sendSms(number, `You are not being forwarded any messages from me! That's awesome because you probably already have Telegram! Rock on! Questions? t.me/svendog`);
    return null;
  }
  if (text.toLowerCase().includes('dingo')) {
    removeMember(number);
    const telegramResponse = `${connection.name} is done listening to this drivel and will no longer be forwarded messages.`;
    return sendTelegram(connection.cid, telegramResponse);
  }
  if (!connection.verified) {
    let fruit, response;
    text.split(' ').forEach(word => {
      if (fruits.includes(word.toLowerCase()) || (word.slice(-1) == 's' && fruits.includes(word.slice(0, -1).toLowerCase()))) fruit = word;
    });

    if (fruit) {
      response = `That's awesome! I'll let everyone know you're bringing ${fruit.slice(-1) == 's' ? 'a bunch of' : 'one'} ${fruit.toLowerCase()}. Feel free to say hello now :) To stop messages at any point, tell me DINGO.`;
      connection.verified = true;
      await setMember(connection);
      const telegramNotification = `Please welcome ${connection.name}, who has graciously brought ${fruit.slice(-1) == 's' ? 'a bunch of' : 'one'} ${fruit.toLowerCase()} to share.`
      sendTelegram(connection.cid, telegramNotification);
    } else {
      response = `That's not a fruit in my book. Tell me the fruit you're actually going to bring or reply with DINGO and I'll quit bugging you.`
    }
    sendSms(connection.number, response);
  }
  else {
    const message = `${connection.name}: ${text}`;
    sendTelegram(connection.cid, message);
  }
}

export const addMember = async (name, number, cid, invitor, title) => {
  number = '+1' + number;
  const cidMember = await getMember(String(cid));
  const member = await getMember(String(number));
  if (cidMember != null && member == null) return `There is already someone recieving messages from this chat eek.`;
  if (member) {
    if (!member.verified) return `I am still waiting on ${name}'s response.`;
    if (member.cid == cid) return `They are already here. Either they're not talking, or you're a bad observer.`;
    return `${number} is already associated with a different chat. We're only supporting one chat at once because multiple chats is honestly very hard to code and I can't figure out a good way for the person sending the SMS to specify which chat they want their message sent. Tell the person to reply DINGO to any message to remove themselves from the other chat.`;
  }
  const connection = new Connection(name, number, cid);
  setMember(connection);
  inviteSms(connection, invitor, title);
  return `I have invited ${name} and will ask what fruit he will be bringing.`;
}

const setMember = async (connection) => {
  // This is just a bad way to set up bidirectional map like functionality
  const identifier = `${connection.number}${connection.name}`;
  await Storage.setItem(String(connection.cid), identifier);
  await Storage.setItem(String(connection.number), identifier);
  await Storage.setItem(identifier, connection);
}

const getMember = async (ident) => {
  if (!ident) return null;
  const identifier = await Storage.getItem(String(ident));
  return await Storage.getItem(String(identifier));
}

export const removeMember = async (number, title, kicker) => {
  if (!number) return null;
  if (number[0] != '+') number = '+1' + number;
  Logger.info(`Removing member with ${number}`);
  const member = await getMember(String(number));
  if (!member) return `No one found with the number ${number}. Yes, I know I added the +1.`;
  const name = member.name;
  let response = `Sadly, ${kicker} has revoked your communication with ${title}. Bring it up with them.`;
  if (!title || !kicker) response = `Very well. I will no longer forward you messages.`;
  sendSms(member.number, response);
  await Storage.removeItem(`${member.number}${member.name}`);
  await Storage.removeItem(String(member.number));
  await Storage.removeItem(String(member.cid));
  return `Removed ${name}. Bye bye.`
}
