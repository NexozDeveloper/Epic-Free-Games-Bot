// ==========================================================
// embeds.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const { EmbedBuilder } = require('discord.js');

const EPIC_PURPLE = 0x7b2fff;
const EPIC_GOLD   = 0xf5a623;
const EPIC_GREY   = 0x2f3136;

/**
 *
 * @param {Game[]} currentGames
 * @returns {EmbedBuilder[]}
 */
function buildCurrentGamesEmbeds(currentGames) {
  const embeds = [];

  const headerEmbed = new EmbedBuilder()
    .setColor(EPIC_PURPLE)
    .setTitle('🎮  Epic Games Store — Free Games This Week!')
    .setDescription(
      `**${currentGames.length} game${currentGames.length !== 1 ? 's' : ''} free** right now on the Epic Games Store.\n` +
      `Claim them before the offer ends — **they're yours to keep forever!**\n\n` +
      `> 🔗 [Browse all free games on EGS](https://store.epicgames.com/en-US/free-games)`
    )
    .setThumbnail(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/1200px-Epic_Games_logo.svg.png'
    )
    .setTimestamp()
    .setFooter({
      text: 'Epic Games Store • Free Games',
      iconURL:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/1200px-Epic_Games_logo.svg.png',
    });

  embeds.push(headerEmbed);

  for (const game of currentGames) {
    const gameEmbed = new EmbedBuilder()
      .setColor(EPIC_GOLD)
      .setTitle(`🆓  ${game.title}`)
      .setURL(game.storeUrl)
      .setDescription(
        truncate(game.description, 300) || '*No description available.*'
      )
      .addFields(
        {
          name: '💰 Original Price',
          value: game.originalPrice,
          inline: true,
        },
        {
          name: '🏢 Publisher',
          value: game.seller,
          inline: true,
        },
        {
          name: '⏰ Offer Ends',
          value: game.endDate
            ? `<t:${Math.floor(game.endDate.getTime() / 1000)}:R> (<t:${Math.floor(game.endDate.getTime() / 1000)}:f>)`
            : 'Unknown',
          inline: false,
        },
        {
          name: '🛒 Claim Now',
          value: `[Click here to grab it for free!](${game.storeUrl})`,
          inline: false,
        }
      );

    if (game.coverImage) {
      gameEmbed.setImage(game.coverImage);
    }

    embeds.push(gameEmbed);
  }

  return embeds;
}

/**
 *
 * @param {Game[]} nextGames
 * @returns {EmbedBuilder}
 */
function buildNextGamesEmbed(nextGames) {
  const embed = new EmbedBuilder()
    .setColor(EPIC_GREY)
    .setTitle('🔮  Coming Up Next Week')
    .setTimestamp()
    .setFooter({ text: 'Epic Games Store • Upcoming Free Games' });

  if (nextGames.length === 0) {
    embed.setDescription('*No upcoming free games announced yet. Check back later!*');
    return embed;
  }

  const lines = nextGames.map((g) => {
    const ts = g.startDate
      ? `<t:${Math.floor(g.startDate.getTime() / 1000)}:R>`
      : 'Soon';
    return `**${g.title}** — Available ${ts}`;
  });

  embed.setDescription(lines.join('\n'));
  return embed;
}

/**
 * @returns {EmbedBuilder}
 */
function buildErrorEmbed() {
  return new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('⚠️  Could not fetch free games')
    .setDescription(
      'There was an error contacting the Epic Games Store API.\n' +
      'Please try again later or check [the EGS website](https://store.epicgames.com/en-US/free-games) directly.'
    )
    .setTimestamp();
}

/**
 * @returns {EmbedBuilder}
 */
function buildNoGamesEmbed() {
  return new EmbedBuilder()
    .setColor(EPIC_GREY)
    .setTitle('😴  No Free Games Right Now')
    .setDescription(
      'It seems Epic hasn\'t listed any free games at the moment.\n' +
      'Check back soon — new games go free every Thursday at 5 PM UTC!\n\n' +
      '> 🔗 [Epic Games Store Free Games](https://store.epicgames.com/en-US/free-games)'
    )
    .setTimestamp();
}

/**
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str;
}

module.exports = {
  buildCurrentGamesEmbeds,
  buildNextGamesEmbed,
  buildErrorEmbed,
  buildNoGamesEmbed,
};
