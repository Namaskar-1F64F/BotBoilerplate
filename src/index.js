import dotenv from 'dotenv';
dotenv.load();
//if (process.env.STARDEW_TELEGRAM_TOKEN) require('./telegram/stardew');
if (process.env.STARDEW_DISCORD_TOKEN) require('./discord/stardew');
if (process.env.DIPLOMACY_TELEGRAM_TOKEN) require('./telegram/diplomacy');