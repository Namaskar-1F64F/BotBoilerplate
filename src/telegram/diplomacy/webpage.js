import * as fs from 'fs';
import request from 'request';
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

const getPhase = (window) => {
  return window.$('.gamePhase').text();
};

const getPhaseEmoji = (window) => {
  return getEmoji('Builds');
};

const getYear = (window) => {
  return window.$('.gameDate').text();
};

const getSeasonEmoji = (window) => {
  const year = getYear(window);
  const season = year ? year.split(',')[0] : '';
  return season ? getEmoji(season) : '';
};

const getTime = (window) => {
  return window.$('.timeremaining').text();
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

const download = (url, dest, cb) => { // From http://stackoverflow.com/a/32134846
  var file = fs.createWriteStream(dest);
  var sendReq = request.get(url);

  // verify response code
  sendReq.on('response', function (response) {
    if (response.statusCode !== 200) {
      return cb('Response status was ' + response.statusCode);
    }
  });

  // check for request errors
  sendReq.on('error', function (err) {
    fs.unlink(dest);
    return cb(err.message);
  });

  sendReq.pipe(file);

  file.on('finish', function () {
    file.close(cb);  // close() is async, call cb after close completes.
  });

  file.on('error', function (err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't 'check' the result)
    return cb(err.message);
  });
};

export { getReadyStates, getPhase, getYear, getTime, download, getUnixTime, getUnixFrom, getPhaseEmoji, getSeasonEmoji, getUnixFinalTime, getUnixFinalDay };