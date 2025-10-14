import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

const command = 'ping';
const description = 'Reply with pong!';

export const data = new SlashCommandBuilder()
  .setName(command)
  .setDescription(description);

export async function execute(interaction: CommandInteraction) {
  await interaction.reply('Pong!');
}
