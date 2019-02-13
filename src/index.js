import dotenv from 'dotenv';
dotenv.load();

// if (process.env.STARDEW_TELEGRAM_TOKEN) require('./telegram/stardew');
// if (process.env.AM_DISCORD_TOKEN) require('./discord/am');
// if (process.env.SVEN_DISCORD_TOKEN) require('./discord/sven');
// if (process.env.DIPLOMACY_TELEGRAM_TOKEN) require('./telegram/diplomacy');
// if (process.env.SMS_TELEGRAM_TOKEN) require('./telegram/notelegram');
require('./interface/telegram');
require('./interface/discord');