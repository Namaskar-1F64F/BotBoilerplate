import Logger from '../../util/logger';
import { sendSms, inviteSms } from './twilio';
import { sendTelegram } from './index';
import { fruits } from './fruits';
import { getMember, getMembers, verifyMember, removeMember, createMember, reactivateMember } from './database';

export const fromTelegram = async (cid, message) => {
  Logger.info(`Recieved message sending to Twilio`);
  const members = await getMembers(cid);
  if (members.length == 0) {
    Logger.info(`Could not find any members subscribed to chat ${cid}.`);
    return null;
  }
  members.forEach(member => {
    if (member.verified) {
      sendSms(member.number, message);
    }
    else {
      Logger.info(`${member.name} has not been verified yet.`);
    }
  })
}

export const fromSms = async (number, text) => {
  Logger.info(`Recieved message from ${number}.`);
  const member = await getMember(number);
  if (member == null) {
    Logger.info(`Could not find member by ${number}.`);
    sendSms(number, `You are not being forwarded any messages from me! That's awesome because you probably already have Telegram! Rock on! Questions? t.me/svendog`);
    return null;
  } else if (!member.active) {
    Logger.info(`Member ${number} is not currently active.`);
    sendSms(number, `You aren't subscribed to any chat. Ask someone who's got Telegram to add you!`);
    return null;

  } else if (text.toLowerCase().includes('dingo')) {
    await unsubscribe(number);
    const telegramResponse = `${member.name} is done listening to this drivel and will no longer be forwarded messages.`;
    return sendTelegram(member.cid, telegramResponse);
  } else if (!member.verified) {
    let fruit, response;
    text.split(' ').forEach(word => {
      if (fruits.includes(word.toLowerCase()) || (word.slice(-1) == 's' && fruits.includes(word.slice(0, -1).toLowerCase()))) fruit = word;
    });

    if (fruit) {
      response = `That's awesome! I'll let everyone know you're bringing ${fruit.slice(-1) == 's' ? 'a bunch of' : 'one'} ${fruit.toLowerCase()}. Feel free to say hello now :) To stop messages at any point, tell me DINGO.`;
      await verifyMember(number);
      const telegramNotification = `Please welcome ${member.name}, who has graciously brought ${fruit.slice(-1) == 's' ? 'a bunch of' : 'one'} ${fruit.toLowerCase()} to share.`
      sendTelegram(member.cid, telegramNotification);
    } else {
      response = `That's not a fruit in my book. Tell me the fruit you're actually going to bring or reply with DINGO and I'll quit bugging you.`
    }
    sendSms(member.number, response);
  }
  else {
    const message = `${member.name}: ${text}`;
    const members = await getMembers(member.cid);
    members.filter(m => m.number != member.number).forEach(m => {
      sendSms(m.number, message);
    })
    sendTelegram(member.cid, message);
  }
}

export const subscribe = async (name, number, cid, title, inviter) => {
  number = '+1' + number;
  const member = await getMember(number);
  if (member == null) {
    const success = await createMember({ cid, name, number });
    if (success) {
      inviteSms(number, title, inviter);
      return `I have invited ${name} and will ask what fruit they will be bringing.`;
    } else {
      return `I was unable to invite ${name}. Tell Kyle to fix his code.`;
    }
  }
  if (member.active) {
    if (!member.verified) return `I am still waiting on ${name}'s response.`;
    if (member.cid == cid) return `They are already here. Either they're not talking, or you're a bad observer.`;
    return `${number} is already associated with a different chat. We're only supporting one chat at once because multiple chats is honestly very hard to code and I can't figure out a good way for the person sending the SMS to specify which chat they want their message sent. Tell the person to reply DINGO to any message to remove themselves from the other chat.`;
  }
  reactivateMember(number, cid);
  inviteSms(number, title, inviter);
  if (member.cid == cid) {
    return `Well, ${name} was removed from here before, but probably didn't bring enough fruit. I'll make sure they bring something better this time.`;
  } else {
    return `I have invited ${name} and will ask what fruit they will be bringing.`;
  }
}

export const unsubscribe = async (number, title, kicker, cid) => {
  if (!number) return null;
  if (!number.startsWith('+1')) number = '+1' + number;
  Logger.info(`Removing member with ${number}`);
  const member = await getMember(number);
  if (member == null || !member.active || member.cid != cid) return `No one found with the number ${number}. Yes, I know I added the +1.`;
  const name = member.name;
  let response = `Sadly, ${kicker} has revoked your communication with ${title}. Bring it up with them.`;
  if (!title || !kicker) response = `Very well. I will no longer forward you messages.`;
  sendSms(member.number, response);
  const success = await removeMember(number);
  if (success) {
    return `Removed ${name}. Bye bye.`
  } else {
    return `I was unable to remove ${member.name}. Tell Kyle his code sucks.`;
  }
}
