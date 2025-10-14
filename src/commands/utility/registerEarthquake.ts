import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandUserOption,
} from 'discord.js';
import { database } from '../../db/index';
import { serversTable } from '../../db/schema';
import { and, eq } from 'drizzle-orm';

const command = 'earthquake';
const description = 'Send earthquake updates to configured channel.';

export const data = new SlashCommandBuilder()
  .setName(command)
  .setDescription(description)
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add a channel for updates.')
      .addUserOption((option: SlashCommandUserOption) =>
        option
          .setName('channel')
          .setDescription('The channel ID to add updates.')
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Remove updates from a channel.')
      .addUserOption((option: SlashCommandUserOption) =>
        option
          .setName('channel')
          .setDescription('The channel ID to remove updates.')
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.inGuild()) return;

  if (!interaction.member) return;

  if (!(interaction.member instanceof GuildMember)) return;

  const member = interaction.member;

  if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    await interaction.reply(
      'You do not have manage messages permissions to do this.'
    );
    return;
  }

  const channelId = interaction.channelId;
  const guildId = interaction.guildId;

  const result = await database
    .select()
    .from(serversTable)
    .where(
      and(
        eq(serversTable.server_id, guildId),
        eq(serversTable.channel_id, channelId)
      )
    );

  const t = result[0];

  await interaction.reply(`${t.id} | ${t.channel_id} | ${t.server_id}`);

  // await database.insert(serversTable).values({
  //   server_id: guildId,
  //   channel_id: channelId,
  // });

  // await interaction.reply(`Channel ID: ${channelId} <#${channelId}>`);
}
