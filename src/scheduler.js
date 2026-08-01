// ==========================================================
// scheduler.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const { fetchFreeGames }          = require('./epicGames');
const { buildCurrentGamesEmbeds, buildNextGamesEmbed, buildErrorEmbed, buildNoGamesEmbed } = require('./embeds');
const storage                     = require('./storage');

/**
 *
 * @param {import('discord.js').TextChannel} channel
 * @param {{ currentGames: Game[], nextGames: Game[] }} games
 */
async function postFreeGames(channel, { currentGames, nextGames }) {
  if (currentGames.length === 0) {
    await channel.send({ embeds: [buildNoGamesEmbed()] });
    return;
  }

  const currentEmbeds = buildCurrentGamesEmbeds(currentGames);
  const chunks        = chunkArray(currentEmbeds, 10);
  for (const chunk of chunks) {
    await channel.send({ embeds: chunk });
  }

  // Send upcoming games embed
  if (nextGames.length > 0) {
    const nextEmbed = buildNextGamesEmbed(nextGames);
    await channel.send({ embeds: [nextEmbed] });
  }
}

/**
 *
 * @param {import('discord.js').Client} client
 */
async function startScheduler(client) {
  console.log('[Scheduler] Started. Checking for free games every hour.');

  const check = async () => {
    console.log('[Scheduler] Checking Epic Games Store for new free games…');

    let games;
    try {
      games = await fetchFreeGames(
        process.env.EGS_LOCALE  ?? 'en-US',
        process.env.EGS_COUNTRY ?? 'US'
      );
    } catch (err) {
      console.error('[Scheduler] Failed to fetch games:', err.message);
      return;
    }

    const currentTitles = games.currentGames.map((g) => g.title).sort();

    const guildIds = storage.getAllConfiguredGuilds();
    console.log(`[Scheduler] Checking ${guildIds.length} configured guild(s)…`);

    for (const guildId of guildIds) {
      try {
        const lastTitles = storage.getLastPostedGames(guildId).sort();

        if (JSON.stringify(currentTitles) === JSON.stringify(lastTitles)) {
          continue;
        }

        const channelId = storage.getChannel(guildId);
        if (!channelId) continue;

        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          console.warn(`[Scheduler] Channel ${channelId} in guild ${guildId} not found or not text-based.`);
          continue;
        }

        console.log(`[Scheduler] New games detected for guild ${guildId} — posting…`);
        await postFreeGames(channel, games);
        storage.setLastPostedGames(guildId, currentTitles);
        console.log(`[Scheduler] Posted to guild ${guildId} successfully.`);
      } catch (err) {
        console.error(`[Scheduler] Error posting to guild ${guildId}:`, err.message);
      }
    }
  };

  await check();
  setInterval(check, 60 * 60 * 1000);

/**
 * @param {any[]} arr
 * @param {number} size
 * @returns {any[][]}
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = { startScheduler, postFreeGames };
