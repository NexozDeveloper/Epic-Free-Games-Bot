// ==========================================================
// deploy-commands.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const path             = require('path');
const fs               = require('fs');

const token    = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID?.trim() || null;

if (!token || !clientId) {
  console.error(
    '❌  Missing BOT_TOKEN or CLIENT_ID in .env\n' +
    'Please fill in your .env file and try again.'
  );
  process.exit(1);
}

const commandsDir = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const command = require(path.join(commandsDir, file));
  if (command.data?.toJSON) {
    commands.push(command.data.toJSON());
    console.log(`  → Loaded command: /${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\nRegistering ${commands.length} application command(s)…`);

    let data;
    if (guildId) {
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`✅  Registered ${data.length} command(s) to guild ${guildId} (instant).`);
    } else {
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`✅  Registered ${data.length} command(s) globally (may take up to 1 hour).`);
    }
  } catch (error) {
    console.error('❌  Failed to register commands:', error);
    process.exit(1);
  }
})();
