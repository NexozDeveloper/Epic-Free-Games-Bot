// ==========================================================
// storage.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'guilds.json');


/**
 * @returns {object}
 */
function load() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), 'utf-8');
    return {};
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * @param {object} data
 */
function save(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}


/**
 * @param {string} guildId
 * @returns {string|null}
 */
function getChannel(guildId) {
  const data = load();
  return data[guildId]?.channelId ?? null;
}

/**
 * @param {string} guildId
 * @param {string} channelId
 */
function setChannel(guildId, channelId) {
  const data = load();
  if (!data[guildId]) data[guildId] = {};
  data[guildId].channelId = channelId;
  save(data);
}

/**
 * @param {string} guildId
 * @returns {string[]}
 */
function getLastPostedGames(guildId) {
  const data = load();
  return data[guildId]?.lastPostedGames ?? [];
}

/**
 * @param {string} guildId
 * @param {string[]} titles
 */
function setLastPostedGames(guildId, titles) {
  const data = load();
  if (!data[guildId]) data[guildId] = {};
  data[guildId].lastPostedGames = titles;
  save(data);
}

/**
 * @returns {string[]}
 */
function getAllConfiguredGuilds() {
  const data = load();
  return Object.keys(data).filter((id) => data[id]?.channelId);
}

module.exports = {
  getChannel,
  setChannel,
  getLastPostedGames,
  setLastPostedGames,
  getAllConfiguredGuilds,
};
