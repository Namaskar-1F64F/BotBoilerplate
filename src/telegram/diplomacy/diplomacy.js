import Logger from '../../util/logger';
import { sendTelegramMessage, sendTelegramPhoto } from './index';
import { GameSnapshot, getPreviousState } from './setup';
import { getContext } from './webpage';
import { JSDOM } from 'jsdom';
import jQuery from 'jquery';
import hash from 'object-hash';
import { saveGame } from './database';
import { formatMessageTelegram, getEmoji } from './util';

class SnapshotContext {
  constructor({ window, countries, previousState, gid }) {
    this.window = window;
    this.countries = countries;
    this.previousState = previousState;
    this.$ = jQuery(this.window);
    this.currentState = new GameSnapshot();
    this.gid = gid;
    const webpageContext = getContext(window);
    this.phaseEmoji = webpageContext.phase.icon;
    this.seasonEmoji = webpageContext.seasonIcon;
    this.timestamp = webpageContext.timestamp;
    this.day = webpageContext.day;
    this.phase = webpageContext.phase.text;
    this.year = webpageContext.year;
    this.timeRemaining = webpageContext.timeRemaining;
    this.readyStates = webpageContext.readyStates;
    this.time = webpageContext.time;
    this.from = webpageContext.from;
  }
}

const checkWebsite = async (cid, gid) => {
  Logger.info(`Checking game: ${gid} for user: ${cid}.`);
  JSDOM.fromURL(`https://webdiplomacy.net/board.php?gameID=${gid}`).then(async dom => {
    let context = new SnapshotContext({
      window: dom.window,
      countries: ["England", "France", "Italy", "Germany", "Austria", "Turkey", "Russia"],
      previousState: await getPreviousState(cid),
      gid
    });

    const newMessages = detectNewMessages(context);
    if (newMessages.messages.length > 0) {
      newMessages.messages.forEach(message => {
        Logger.verbose(`Sending global message to ${cid} for ${gid}`);
        sendTelegramMessage(cid, formatMessageTelegram(message), { parse_mode: "Markdown" });
      });
      context.currentState.hashedMessages = { ...context.previousState.hashedMessages, ...newMessages.hashes };
    } else {
      context.currentState.hashedMessages = context.previousState.hashedMessages;
    }

    const newPhase = detectPhaseChange(context);
    if (newPhase) {
      Logger.verbose(`Sending photo-phase change to ${cid} for ${gid}:\n${newPhase.message}`);
      sendTelegramPhoto(cid, `https://webdiplomacy.net/map.php?mapType=large&gameID=${gid}&turn=500`, { caption: newPhase.message });
      context.currentState.phase = newPhase.phase;
      context.currentState.year = newPhase.year;
    } else {
      context.currentState.phase = context.previousState.phase;
      context.currentState.year = context.previousState.year;
    }

    const newChange = detectReadyChange(context);
    if (newChange) {
      Logger.verbose(`Sending ready message to ${cid} for ${gid}:\n${newChange.message}`);
      sendTelegramMessage(cid, newChange.message, { parse_mode: "Markdown", disable_web_page_preview: true });
      context.currentState.readyStates = newChange.readyStates;
    } else {
      context.currentState.readyStates = context.previousState.readyStates;
    }

    const timeWarning = detectTimeWarning(context);
    if (timeWarning) {
      Logger.verbose(timeWarning.message);
      sendTelegramMessage(cid, timeWarning.message, { parse_mode: "Markdown", disable_web_page_preview: true });
    }

    context.currentState.initialRun = false;
    saveGame(cid, context.currentState);
  })
}

const detectNewMessages = ({ $, previousState, countries }) => {
  let newMessages = { messages: [], hashes: {} };
  if ($('.gamePanelHome').length == 0) {
    $("#chatboxscroll>table>tbody>tr>.right").each((_, e) => {
      if (e.classList != null) {
        const countryClass = e.classList[1];
        let countryString = 'Moderator';
        if (countryClass != null) {
          countryString = 'Country';
          const countryNumber = countryClass.replace('country', '');
          const countryShiftedNumber = parseInt(countryNumber) - 1;
          if (countryShiftedNumber <= countries.length - 1);
          countryString = countries[parseInt(countryNumber) - 1];
        }
        const text = e.innerHTML.split(':').splice(-1)[0].trim();
        if (text != null) {
          const message = `${getEmoji(countryString)} ${countryString}: ${text}`;
          const hashedMessage = hash(message);
          if (previousState.hashedMessages[hashedMessage] != true) {
            newMessages.messages.push(message);
            newMessages.hashes[hashedMessage] = true;
          }
        }
      }
    });
  }
  return newMessages;
}

const detectPhaseChange = ({ readyStates, previousState, phase, year, seasonEmoji, phaseEmoji, timestamp, day }) => {
  if ((previousState.phase != phase || previousState.year != year) && !previousState.initialRun) {
    const season = year.split(',')[0];
    var message = `${seasonEmoji} ${year} - ${phaseEmoji} ${phase}
${getEmoji('mantelpiece_clock')} ${season == 'Autumn' ? 'Spring' : 'Autumn'} at ${timestamp} on ${day}!\n`;
    const { ready, notreceived, completed } = readyStates.status;
    ready.concat(notreceived, completed).forEach(country => {
      message += getEmoji(country);
    });
    return { message, phase, year };
  }
}

const detectReadyChange = ({ countries, previousState, readyStates, phase, year, seasonEmoji, phaseEmoji, gid, timeRemaining, day, timestamp }) => {
  const numWithOrders = countries.length - readyStates.status.none.length - readyStates.status.defeated.length;
  const numToDisplay = numWithOrders - 3 > 0 ? numWithOrders - 3 : 0;
  if (!previousState.initialRun
    && previousState.readyStates.status.ready.length != readyStates.status.ready.length
    && readyStates.status.ready.length > numToDisplay
    && phase != undefined) {
    const { ready, completed, notreceived } = readyStates.status;
    const message = `*${seasonEmoji} ${year} - *${phaseEmoji} [${phase}](https://webdiplomacy.net/board.php?gameID=${gid})
*Ready*        ${ready.map(getEmoji).join('')}
*Not ready* ${completed.concat(notreceived).map(getEmoji).join('')}
_${timeRemaining} remaining_
${getEmoji('mantelpiece_clock')} ${day}, ${timestamp}`;
    return { readyStates, message };
  }
}

const detectTimeWarning = ({ time, from, seasonEmoji, readyStates, year, phaseEmoji, phase, gid }) => {
  const { notreceived } = readyStates.status;
  if (time && from) {
    var left = (time - from);
    if (left < 1980 && left > 1620) {
      const message = `*${seasonEmoji} ${year}* - ${phaseEmoji} [${phase}](https://webdiplomacy.net/board.php?gameID=${gid})
${getEmoji('hourglass')} _A half hour remains_${notreceived.length < 0 ? `, ${notreceived.map(getEmoji).join('')}.` : '.'}`;
      return { message };
    }
  }
}

export { checkWebsite };
