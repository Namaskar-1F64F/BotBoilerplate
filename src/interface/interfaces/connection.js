export default class Connection {
  constructor({ telegram, discord }) {
    Logger.verbose(`Creating connection for ${telegram ? 'telegram' : 'discord'}.`);
    this.connections = [];
    if (telegram != null) {
      if (telegram.id != null) {
        this.connections.push({ telegram: { id } });
      }
    }
    if (discord != null) {
      if (discord.id != null) {
        this.connections.push({ discord: { id } });
      }
    }
  }
}