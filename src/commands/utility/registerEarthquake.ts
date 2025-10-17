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
import { log } from '../../logger';

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

  if (interaction.options.getSubcommand() === 'add') {
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;

    const result = await query_server(guildId);

    if (result.length != 0) {
      const status = await update_server(channelId, guildId);

      if (!status) {
        await interaction.reply('Failed to update subscription channel.');
        return;
      }

      await interaction.reply(
        `Earthquake updates moved to this channel <#${channelId}>`
      );
    } else {
      const status = await insert_server(channelId, guildId);

      if (!status) {
        await interaction.reply('Failed to subscribe to updates.');
        return;
      }

      await interaction.reply(
        `Earthquake updates added to this channel <#${channelId}>`
      );
    }
  }

  if (interaction.options.getSubcommand() === 'delete') {
    const guildId = interaction.guildId;

    const result = await query_server(guildId);

    if (result.length != 0) {
      const result = await delete_server(guildId);

      if (!result) {
        await interaction.reply('Failed to delete subscription.');
        return;
      }
    }
  }
}

async function delete_server(guildId: string) {
  try {
    await database
      .delete(serversTable)
      .where(eq(serversTable.server_id, guildId));
  } catch (e) {
    log.error(
      `Failed to delete data to servers table with value guild ID: ${guildId}.`
    );
    return false;
  }
  return true;
}

async function query_server(guildId: string) {
  return await database
    .select()
    .from(serversTable)
    .where(eq(serversTable.server_id, guildId));
}

async function insert_server(channelId: string, guildId: string) {
  try {
    await database.insert(serversTable).values({
      server_id: guildId,
      channel_id: channelId,
    });
  } catch (e) {
    log.error(
      `Failed to insert data to servers table with values channel ID and guild ID: ${channelId}, ${guildId}.`
    );
    return false;
  }
  return true;
}

async function update_server(channelId: string, guildId: string) {
  try {
    await database
      .update(serversTable)
      .set({
        channel_id: channelId,
      })
      .where(eq(serversTable.server_id, guildId));
  } catch (e) {
    log.error(
      `Failed to update data to servers table with values channel ID and guild ID: ${channelId}, ${guildId}.`
    );
    return false;
  }
  return true;
}
