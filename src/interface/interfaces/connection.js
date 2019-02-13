import Logger from '../../util/logger';

export default class Connection {
  constructor(id, type) {
    if (id == null) throw new Error('ID can not be null');
    this.id = id;
    Logger.verbose(`Creating connection for ${type}.`);
    type = String(type).toLowerCase();
    if (!['discord', 'telegram'].includes(type)) throw new Error('Only supporting discord/telegram.');
    this.type = type;
  }
}