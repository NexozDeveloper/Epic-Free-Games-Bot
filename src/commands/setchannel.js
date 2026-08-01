// ==========================================================
// setchannel.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');
const storage = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set the channel where Epic free game announcements will be posted.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The text channel to use for announcements')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');

    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions?.has(['SendMessages', 'EmbedLinks'])) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌  Missing Permissions')
            .setDescription(
              `I don't have permission to send messages or embed links in ${channel}.\n` +
              `Please grant me **Send Messages** and **Embed Links** in that channel, then try again.`
            ),
        ],
      });
    }

    storage.setChannel(interaction.guildId, channel.id);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('✅  Announcement Channel Set!')
          .setDescription(
            `Epic Games Store free game announcements will now be posted in ${channel}.\n\n` +
            `The bot checks for new free games **every hour** and will post automatically when the weekly lineup rotates.\n\n` +
            `Use \`/freegames\` to post the current lineup right now.`
          )
          .setTimestamp()
          .setFooter({ text: 'Epic Free Games Bot' }),
      ],
    });
  },
};
