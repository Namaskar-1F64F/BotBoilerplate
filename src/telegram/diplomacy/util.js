import sanitizeHtml from 'sanitize-html';
import emoji from 'node-emoji';

const formatMessageTelegram = (message) => {
  return sanitizeHtml(message
    .replace(/<br>/g, '\n')
    .replace(/\*/g, '')
    .replace(/<strong>|<\/strong>/g, '*')
  );
};

const emojiMap = new Map([
  ['new-york', 'apple'],
  ['heartland', 'horse'],
  ['california', 'surfer'],
  ['texas', 'star'],
  ['british-columbia', 'field_hockey_stick_and_ball'],
  ['peru', 'mountain'],
  ['florida', 'palm_tree'],
  ['cuba', 'baseball'],
  ['mexico', 'taco'],
  ['quebec', 'ice_hockey_stick_and_puck'],
  ['russia', 'flag-ru'],
  ['turkey', 'flag-tr'],
  ['italy', 'flag-it'],
  ['england', 'flag-gb'],
  ['france', 'flag-fr'],
  ['austria', 'flag-at'],
  ['germany', 'flag-de'],
  ['greece', 'flag-gr'],
  ['egypt', 'flag-eg'],
  ['rome', 'flag-it'],
  ['persia', 'flag-ir'],
  ['carthage', 'flag-tn'],
  ['autumn', 'fallen_leaf'],
  ['spring', 'blossom'],
  ['builds', 'hammer'],
  ['retreats', 'waving_white_flag'],
  ['diplomacy', 'globe_with_meridians'],
]);

const getEmoji = (country) => { // easier to lookup and return country flags so case doesn't mess us up
  if (!country) return '';
  const countryIcon = emojiMap.get(country.toLowerCase());
  if (countryIcon) {
    return emoji.get(countryIcon)
  }
  return emoji.get(country);
};

export { getEmoji, formatMessageTelegram };