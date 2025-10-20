import {
  Client,
  Collection,
  GatewayIntentBits,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;

log.info('Bot is starting...');

interface Command {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (...args: any[]) => Promise<void>;
  [key: string]: any;
}

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const extension = checkProductionEnv() ? '.js' : '.ts';

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(extension));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    (async () => {
      const command: Command = await import(filePath).then(
        mod => mod.default || mod
      );
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        log.debug(`Command name loaded: ${command.data.name}`);
      } else {
        log.warning(
          `The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    })();
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter(file => file.endsWith(extension));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  (async () => {
    const event = await import(filePath).then(mod => mod.default || mod);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    log.debug(`Event name loaded: ${event.name}`);
  })();
}

client.login(token);

function checkProductionEnv(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return false;
}
