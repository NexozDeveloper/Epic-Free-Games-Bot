// ==========================================================
// index.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ActivityType,
  REST,
  Routes,
} = require('discord.js');
const path = require('path');
const fs   = require('fs');

const { startScheduler } = require('./scheduler');

if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) {
  console.error(
    '❌  BOT_TOKEN or CLIENT_ID is missing from your environment variables.\n' +
    'Please fill them in and restart the bot.'
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.commands = new Collection();
const commandsDir  = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
const commandDefs  = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsDir, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandDefs.push(command.data.toJSON());
    console.log(`[Commands] Loaded: /${command.data.name}`);
  } else {
    console.warn(`[Commands] Skipped ${file} — missing data or execute export.`);
  }
}

async function deployCommands() {
  const rest     = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  const clientId = process.env.CLIENT_ID;
  const guildId  = process.env.GUILD_ID?.trim() || null;

  try {
    console.log(`[Deploy] Registering ${commandDefs.length} slash command(s)…`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandDefs,
      });
      console.log(`[Deploy] ✅ Commands registered to guild ${guildId} (instant).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandDefs,
      });
      console.log('[Deploy] ✅ Commands registered globally (up to 1h to propagate).');
    }
  } catch (err) {
    console.error('[Deploy] ❌ Failed to register commands:', err.message);
  }
}


client.once(Events.ClientReady, async (readyClient) => {
  console.log(`\n✅  Logged in as ${readyClient.user.tag}`);
  console.log(`📡  Serving ${readyClient.guilds.cache.size} guild(s)\n`);

  readyClient.user.setPresence({
    activities: [
      {
        name: '🎮 Epic Free Games',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });

  await startScheduler(readyClient);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[Interaction] Unknown command: /${interaction.commandName}`);
    return interaction.reply({
      content: '❌ Unknown command.',
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Interaction] Error in /${interaction.commandName}:`, error);

    const errorMsg = {
      content: '❌ An unexpected error occurred while running this command.',
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
});

process.on('SIGINT',  () => { console.log('\n[Bot] Shutting down…'); client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[Bot] Shutting down…'); client.destroy(); process.exit(0); });

(async () => {
  await deployCommands();
  console.log('[Bot] Connecting to Discord…');
  client.login(process.env.BOT_TOKEN);
})();
