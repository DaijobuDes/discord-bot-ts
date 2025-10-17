import { Client, Events } from 'discord.js';
import { getEarthquakeUpdates } from '../tasks/fetchEarthquakeUpdate';
import { log } from '../logger';

export const name = Events.ClientReady;

export const once = true;
export function execute(client: Client): void {
  if (!client.user) return;
  log.info(`Ready! Logged in as ${client.user.tag}`);

  async function runTasks() {
    await getEarthquakeUpdates(client);
  }

  runTasks();
}
