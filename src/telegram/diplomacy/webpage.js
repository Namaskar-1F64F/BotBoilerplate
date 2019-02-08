import { getEmoji } from './util';
import moment from 'moment';

const getReadyStates = (window) => {
  // The ready states are holding every group individually because we use no status as well as defeated status separately
  const readyStates = { 'status': { 'ready': [], 'notreceived': [], 'completed': [], 'none': [], 'defeated': [] } };
  // look through all countries status and check if the img is a green check.
  window.$.each(window.$('.memberCountryName'), function (idx, element) {
    const jElement = window.$(element); // need jQuery object
    const status = jElement.find('img').attr('alt'); // green check
    const country = jElement.text().trim(); // there are 2 spaces after img
    const defeated = jElement.find('span').hasClass('memberStatusDefeated');
    if (defeated) {
      readyStates.status.defeated.push(country);
    }
    else if (status == "Ready")
      readyStates.status.ready.push(country);
    else if (status == "Completed")
      readyStates.status.completed.push(country);
    else if (status == "Not received")
      readyStates.status.notreceived.push(country);
    else
      readyStates.status.none.push(country.replace('- ', '')); // no status countries have a dash instead of an icon
  });
  return readyStates;
};

const getPhase = (window) => window.$('.gamePhase').text();

const getPhaseEmoji = (window) => getEmoji(getPhase(window));

const getYear = (window) => window.$('.gameDate').text();

const getTime = (window) => window.$('.timeremaining').text();

const getSeasonEmoji = (window) => {
  const year = getYear(window);
  const season = year ? year.split(',')[0] : '';
  return season ? getEmoji(season) : '';
};

const getUnixFinal = (window) => {
  const span = window.document.querySelector('.timestamp');
  if (!span) return 0;
  const time = parseInt(span.attributes.getNamedItem('unixtime').value);
  if (!time) return 0;
  return time;
}

const getUnixFinalTime = (window) => {
  const time = getUnixFinal(window);
  if (!time) return '';
  return moment.unix(time).format('h:m A');
};

const getUnixFinalDay = (window) => {
  const time = getUnixFinal(window);
  if (!time) return '';
  return moment.unix(time).format('dddd');
}

const getUnixTime = (window) => {
  const span = window.document.querySelector('.timeremaining');
  if (!span) return 0;
  const time = parseInt(span.attributes.getNamedItem('unixtime').value);
  if (!time) return 0;
  return time;
};

const getUnixFrom = (window) => {
  const span = window.document.querySelector('.timeremaining');
  if (!span) return 0;
  const from = parseInt(span.attributes.getNamedItem('unixtimefrom').value);
  if (!from) return 0;
  return from;
};

export const getContext = (window) => {
  {
    return {
      from: getUnixFrom(window),
      time: getUnixTime(window),
      timestamp: getUnixFinalTime(window),
      day: getUnixFinalDay(window),
      seasonIcon: getSeasonEmoji(window),
      timeRemaining: getTime(window),
      readyStates: getReadyStates(window),
      phase: {
        text: getPhase(window),
        icon: getPhaseEmoji(window)
      },
      year: getYear(window)
    }
  }
}
