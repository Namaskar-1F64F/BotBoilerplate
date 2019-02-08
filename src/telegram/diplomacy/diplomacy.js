import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { getPreviousState, getCurrentState } from './setup';
import { getPhase, getYear, getTime, getReadyStates, getUnixTime, getUnixFrom, getPhaseEmoji, getSeasonEmoji, getUnixFinalTime, getUnixFinalDay } from './webpage';
import { JSDOM } from 'jsdom'; // used to create dom to navigate through jQuery
import jQuery from 'jquery';
import hash from 'object-hash'; // hashing messages for quick lookups
import { saveGame } from './database';
import { formatMessageTelegram, getEmoji } from './util';
const telegram = getBot(process.env.DIPLOMACY_TELEGRAM_TOKEN, "WebDiplomacy");

const checkWebsite = async (cid, gid) => {
  let countries = ["England", "France", "Italy", "Germany", "Austria", "Turkey", "Russia"];

  Logger.info("Checking game: %s for user: %s.", gid, cid);

  let previousState = await getPreviousState(cid);
  let currentState = getCurrentState();
  JSDOM.fromURL(`http://webdiplomacy.net/board.php?gameID=${gid}`).then(dom => {
    const window = dom.window;
    const $ = jQuery(window);
    Logger.info('Checking for updates.');
    // ***** Get all messages in global chatbox ****
    let newMessages = $("#chatboxscroll>table>tbody>tr");
    const phaseEmoji = getPhaseEmoji(window);
    const seasonEmoji = getSeasonEmoji(window);
    const timestamp = getUnixFinalTime(window);
    const day = getUnixFinalDay(window);
    // For each message,
    if ($('.gamePanelHome').length == 0) {
      for (var i = 0; i < newMessages.length; i++) {
        if (newMessages.eq(i).find('td').eq(1).length > 0) {
          var message = {
            // countries are found by looking at what class they are -> country1, country2 ...
            // so we are taking the substring up to the number
            "country": newMessages.eq(i).find('td').eq(1).attr('class').substring(13),
            // NEED to replace tags for correct line feeds, and telegram likes <b> not <strong>
            "text": formatMessageTelegram(newMessages.eq(i).find('td').eq(1).html())
          };
          // store message hash into current state hashtable
          if (previousState.hashedMessages != undefined) {
            // if the hashed message isn't in the previous state, we need to send it
            if (previousState.hashedMessages[hash(message)] != true) {
              previousState.hashedMessages[hash(message)] = true;
              if (!previousState.initialRun && message.text.indexOf('Autumn, ') == -1 && message.text.indexOf('Spring, ') == -1) {
                var globalMessage = message.country <= 7 ? (getEmoji(countries[message.country - 1])
                  + " ") : "" + message.text;
                Logger.verbose(`Sending global message to ${cid} for ${gid}:\n${globalMessage}`);
                telegram.sendMessage(cid, globalMessage.length == 0 ? 'Global message.' : globalMessage, { parse_mode: "HTML" });
              }
            }
          }
        }
      }
    }
    // **** get year and phase ****
    currentState.phase = getPhase(window);
    currentState.year = getYear(window);

    // **** ready states
    var timeRemaining = getTime(window); // Used to display alongside ready status
    currentState.readyStates = getReadyStates(window);
    // Here we don't want to update every time a country is ready unless there are only a few countries that have ready status
    var numWithOrders = 7 - currentState.readyStates.status.none.length - currentState.readyStates.status.defeated.length;
    var numToDisplay = numWithOrders - 3 > 0 ? numWithOrders - 3 : 0;
    /*Logger.info("There are %s countries with orders and %s ready. Displaying at >%s",
        numWithOrders, currentState.readyStates.status.ready.length, numToDisplay);*/
    // phase changed, send alert
    if (previousState.year != undefined
      && previousState.phase != undefined
      && (previousState.phase != currentState.phase || previousState.year != currentState.year) // This solves the problem of build/retreat phases not changing the current year
      && !previousState.initialRun) {
      var phaseMessage = `${seasonEmoji} ${currentState.year} - ${phaseEmoji} ${currentState.phase}\n${getEmoji('mantelpiece_clock')} ${currentState.year.split(',')[0] == 'Autumn' ? 'Spring' : 'Autumn'} at ${timestamp} on ${day}!\n`;
      for (var i = 0; i < currentState.readyStates.status.ready.length; i++) {
        phaseMessage += getEmoji(currentState.readyStates.status.ready[i]);
      }
      for (var i = 0; i < currentState.readyStates.status.notreceived.length; i++) {
        phaseMessage += getEmoji(currentState.readyStates.status.notreceived[i]);
      }
      for (var i = 0; i < currentState.readyStates.status.completed.length; i++) {
        phaseMessage += getEmoji(currentState.readyStates.status.completed[i]);
      }
      Logger.verbose(`Sending photo-phase change to ${cid} for ${gid}:\n${phaseMessage}`);
      telegram.sendPhoto(cid, `https://webdiplomacy.net/map.php?mapType=large&gameID=${gid}&turn=500`, { caption: phaseMessage });
    }
    // ready count changed, send alert.
    if (!previousState.initialRun // new run
      && previousState.readyStates.status.ready.length != currentState.readyStates.status.ready.length // status changed
      && currentState.readyStates.status.ready.length > numToDisplay // we are above threashold to display
      && currentState.phase != undefined) { // there is a phase to display just so nothing fails when displaying
      var readyMessage = "*" + seasonEmoji + " " + currentState.year + "  *" + phaseEmoji + " [" + currentState.phase + "](http://webdiplomacy.net/board.php?gameID=" + gid + ")\n"
        + "*Ready*        "; //asterisk and underscores are for formatting
      // Add up all the non-(no status) countries
      for (var i = 0; i < currentState.readyStates.status.ready.length; i++)
        readyMessage += getEmoji(currentState.readyStates.status.ready[i]);
      readyMessage += "\n*Not ready* ";
      for (var i = 0; i < currentState.readyStates.status.completed.length; i++)
        readyMessage += getEmoji(currentState.readyStates.status.completed[i]);
      for (var i = 0; i < currentState.readyStates.status.notreceived.length; i++)
        readyMessage += getEmoji(currentState.readyStates.status.notreceived[i]);
      readyMessage += `\n_${timeRemaining} remaining_\n${getEmoji('mantelpiece_clock')} ${day}, ${timestamp}`;
      Logger.verbose(`Sending ready message to ${cid} for ${gid}:\n${readyMessage}`);
      telegram.sendMessage(cid, readyMessage, { parse_mode: "Markdown", disable_web_page_preview: true });
    }
    const time = getUnixTime(window);
    const from = getUnixFrom(window);
    if (time && from) {
      var left = (time - from);
      if (left < 1980 && left > 1620) {
        const message = `*${seasonEmoji} ${currentState.year}* - ${phaseEmoji} [${currentState.phase}](http://webdiplomacy.net/board.php?gameID="${gid}")
${getEmoji('hourglass')} _A half hour remains._`;
        Logger.verbose(message);
        telegram.sendMessage(cid, message, { parse_mode: "Markdown", disable_web_page_preview: true });
      }
    }

    // we need to now save current state to compare to next update.
    // we aren't copying the whole object because the hashed messages wouldn't stay
    previousState.year = currentState.year;
    previousState.phase = currentState.phase;
    previousState.readyStates = currentState.readyStates;
    previousState.initialRun = false;

    saveGame(cid, previousState);
  })
}

export { checkWebsite };
