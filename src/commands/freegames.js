// ==========================================================
// freegames.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchFreeGames }                     = require('../epicGames');
const { postFreeGames }                      = require('../scheduler');
const { buildErrorEmbed }                    = require('../embeds');
const storage                                = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('freegames')
    .setDescription('Show the current Epic Games Store weekly free games right now.')
    .addBooleanOption((option) =>
      option
        .setName('here')
        .setDescription('Post in this channel instead of the configured announcement channel')
        .setRequired(false)
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const postHere = interaction.options.getBoolean('here') ?? false;
    let targetChannel = interaction.channel;

    if (!postHere) {
      const configuredChannelId = storage.getChannel(interaction.guildId);
      if (configuredChannelId) {
        const configured = await interaction.guild.channels
          .fetch(configuredChannelId)
          .catch(() => null);
        if (configured?.isTextBased()) {
          targetChannel = configured;
        }
      }
    }

    let games;
    try {
      games = await fetchFreeGames(
        process.env.EGS_LOCALE  ?? 'en-US',
        process.env.EGS_COUNTRY ?? 'US'
      );
    } catch (err) {
      console.error('[/freegames] API error:', err.message);
      return interaction.editReply({ embeds: [buildErrorEmbed()] });
    }

    if (targetChannel.id !== interaction.channel.id) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x7b2fff)
            .setDescription(`📢 Posting the free games in ${targetChannel}!`),
        ],
      });
      await postFreeGames(targetChannel, games);
    } else {
      await interaction.deleteReply().catch(() => {});
      await postFreeGames(targetChannel, games);
    }
  },
};
