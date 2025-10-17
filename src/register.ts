import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger';

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN ?? '';
const clientId = process.env.DISCORD_CLIENT_ID ?? '';
const guildId = process.env.DISCORD_GUILD_ID ?? '';

let commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.ts'));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      log.warning(
        `The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
});
const rest = new REST().setToken(token);

// and deploy your commands!
client.once('ready', async () => {
  const guilds = client.guilds.cache.map(guild => guild.id);
  console.log(guilds);
  for (const guildId of guilds) {
    try {
      log.info(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data: any = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );

      log.success(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  }
});

client.login(token);
