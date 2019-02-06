import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

let myTransports = [
  new transports.Console({
    level: 'info',
    format: format.combine(
      format.colorize(),
      format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  })
];

if (process.env.LOG_DIRECTORY != null) {
  const logDir = process.env.LOG_DIRECTORY;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const filename = path.join(logDir, 'bot.log');
  myTransports.push(new transports.File({ filename }));
}

export default createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: myTransports
});