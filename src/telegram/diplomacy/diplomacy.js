import Logger from '../../util/logger';
import { getBot } from '../../util/telegram';
import { getPreviousState, getCurrentState } from './setup';
import { download, getPhase, getYear, getTime, getReadyStates, getUnixTime, getUnixFrom, getPhaseEmoji, getSeasonEmoji, getUnixFinalTime, getUnixFinalDay } from './webpage';
import { env } from 'jsdom'; // used to create dom to navigate through jQuery
import hash from 'object-hash'; // hashing messages for quick lookups
import * as fs from 'fs'; //storing json to disk
import * as path from 'path';
import { formatMessageTelegram, getEmoji } from './util';
const telegram = getBot(process.env.DIPLOMACY_TELEGRAM_TOKEN, "WebDiplomacy");

const checkWebsite = (cid, gid) => {
  try {
    let countries = ["England", "France", "Italy", "Germany", "Austria", "Turkey", "Russia"];

    Logger.info("Checking game: %s for user: %s.", gid, cid);

    let previousState = getPreviousState(cid);
    let currentState = getCurrentState();
    let jquery = fs.readFileSync(path.resolve(__dirname, 'jQuery.js')).toString();
    env({
      url: "http://webdiplomacy.net/board.php?gameID=" + gid,
      src: [jquery],
      done: function (err, window) {
        if (err) {
          Logger.info('Broke something yo');
          Logger.info(err);
          return;
        }
        Logger.info('Checking for updates.');
        // ***** Get all messages in global chatbox ****
        let newMessages = window.$("#chatboxscroll>table>tbody>tr");
        const phaseEmoji = getPhaseEmoji(window);
        const seasonEmoji = getSeasonEmoji(window);
        const timestamp = getUnixFinalTime(window);
        const day = getUnixFinalDay(window);
        // For each message,
        if (window.$('.gamePanelHome').length == 0) {
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
              if (previousState[cid].hashedMessages != undefined) {
                // if the hashed message isn't in the previous state, we need to send it
                if (previousState[cid].hashedMessages[hash(message)] != true) {
                  previousState[cid].hashedMessages[hash(message)] = true;
                  if (!previousState[cid].initialRun && message.text.indexOf('Autumn, ') == -1 && message.text.indexOf('Spring, ') == -1) {
                    var globalMessage = message.country <= 7 ? (getEmoji(countries[message.country - 1])
                      + " ") : "" + message.text;
                    Logger.verbose(`Sending global message to ${cid} for ${gid}:\n${globalMessage}`);
                    telegram.sendMessage(cid, globalMessage.length==0 ? 'Global message.' : globalMessage, { parse_mode: "HTML" });
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
        if (previousState[cid].year != undefined
          && previousState[cid].phase != undefined
          && (previousState[cid].phase != currentState.phase || previousState[cid].year != currentState.year) // This solves the problem of build/retreat phases not changing the current year
          && !previousState[cid].initialRun) {
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
          download('http://webdiplomacy.net/map.php?mapType=large&gameID=' + gid + '&turn=500', './' + gid + '.png', function (err) {
            if (err == undefined) telegram.sendPhoto(cid, './' + gid + '.png', { caption: phaseMessage });
          });
        }
        // ready count changed, send alert.
        if (!previousState[cid].initialRun // new run
          && previousState[cid].readyStates.status.ready.length != currentState.readyStates.status.ready.length // status changed
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
            const message = `*${seasonEmoji} ${currentState.year}*${phaseEmoji} [${currentState.phase}](http://webdiplomacy.net/board.php?gameID="${gid}")
${getEmoji('hourglass')} _A half hour remains._`;
            Logger.verbose(message);
            telegram.sendMessage(cid, message, { parse_mode: "Markdown", disable_web_page_preview: true });
          }
        }

        // we need to now save current state to compare to next update.
        // we aren't copying the whole object because the hashed messages wouldn't stay
        previousState[cid].year = currentState.year;
        previousState[cid].phase = currentState.phase;
        previousState[cid].readyStates = currentState.readyStates;
        previousState[cid].initialRun = false;

        fs.writeFileSync(cid + '.json', JSON.stringify(previousState[cid]), "utf8");
      }
    });
  } catch (err) {
    Logger.error(`diplomacy.js ${err}`);
  }
}

export { checkWebsite };
