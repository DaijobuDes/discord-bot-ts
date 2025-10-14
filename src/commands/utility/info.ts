import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandUserOption, User } from "discord.js";

const command = "info";
const description = "Get information about a user or the server.";

export const data = new SlashCommandBuilder()
  .setName(command)
  .setDescription(description)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("user")
      .setDescription("Get information about a user")
      .addUserOption((option: SlashCommandUserOption) => option.setName("target").setDescription("The user to be fetched"))
      .addBooleanOption((option: SlashCommandBooleanOption) => option.setName("ephemeral").setDescription("Set to false if you want to let everyone see the message."))
  )
  .addSubcommand((subcommand) => subcommand.setName("server").setDescription("Get information about the server."));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.inGuild()) return;

  if (!interaction.member) return;

  if (!(interaction.member instanceof GuildMember)) return;

  if (interaction.options.getSubcommand() === "user") {
    const user = interaction.options.getUser("target");
    const ephemeral: boolean = interaction.options.getBoolean("ephemeral") ?? false;

    if (!user) {
      await interaction.reply({ content: "No user supplied.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!(user instanceof User)) {
      await interaction.reply({ content: "Invalid user supplied.", flags: MessageFlags.Ephemeral });
      return;
    }

    const userId = user.id;
    const avatarId = user.avatar;
    const username = user.username;
    const nickname = user.displayName;

    const guild = interaction.guild;
    let memberJoinTimestamp = null;
    let roles = "";

    if (!guild) {
      await interaction.reply({ content: "You are not on a guild!", flags: MessageFlags.Ephemeral });
      return;
    }

    const memberCache = guild.members.cache;
    const member = memberCache.get(user.id);

    if (!member?.joinedTimestamp) {
      await interaction.reply({ content: "Member invalid.", flags: MessageFlags.Ephemeral });
      return;
    }

    memberJoinTimestamp = Math.round(member.joinedTimestamp / 1000);

    if (!member) {
      await interaction.reply({ content: "Member invalid.", flags: MessageFlags.Ephemeral });
      return;
    }

    const roleCache = member.roles.cache;
    const roleColor = member.roles.color?.color ?? 0x00b0f4;

    for (const [k, v] of roleCache) {
      if (!v.id || v.name === "@everyone") {
        roles += "@everyone";
        continue;
      }
      roles += `<@&${v.id}> `;
    }

    const createdAtTimestampSnowflake = Math.round(user.createdTimestamp / 1000);

    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: `User Info for ${username}`,
      iconURL: `https://cdn.discordapp.com/avatars/${userId}/${avatarId}?size=64`,
    });
    embed.addFields(
      {
        name: "ID",
        value: `${userId}`,
        inline: true,
      },
      {
        name: "Nickname",
        value: `${nickname}`,
        inline: true,
      },
      {
        name: "Created At",
        value: `<t:${createdAtTimestampSnowflake}:F>`,
        inline: false,
      },
      {
        name: "Join date",
        value: `<t:${memberJoinTimestamp}:F>`,
        inline: false,
      },
      {
        name: "Roles",
        value: `${roles}`,
        inline: false,
      }
    );
    embed.setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${avatarId}?size=4096`);
    embed.setColor(roleColor);
    embed.setFooter({
      text: `Command ran /info user ${username}`,
    });
    embed.setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : undefined });
  } else if (interaction.options.getSubcommand() === "server") {
    console.log("server");
  }
}
