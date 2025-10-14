import { Client, Collection, GatewayIntentBits, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;

console.log("Bot is starting...");

interface Command {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (...args: any[]) => Promise<void>;
  [key: string]: any;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    (async () => {
      const command: Command = await import(filePath).then((mod) => mod.default || mod);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`${command.data.name} loaded`);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    })();
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  (async () => {
    const event = await import(filePath).then((mod) => mod.default || mod);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  })();
}

client.login(token);
