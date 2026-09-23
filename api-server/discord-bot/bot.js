const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DISCRORD_TOKEN = process.env.DISCORD_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'IMPERIO_ADMIN_2024';
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Slash command definition
const commands = [
  new SlashCommandBuilder()
    .setName('gerarchave')
    .setDescription('Gera uma nova chave de licença ImperioStore')
    .addIntegerOption(option =>
      option.setName('dias')
        .setDescription('Dias de validade (padrão: 30)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('device')
        .setDescription('Device ID (opcional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('senha')
        .setDescription('Senha de admin')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Verifica o status do servidor'),
].map(command => command.toJSON());

async function generateKey(days, deviceId) {
  try {
    const response = await axios.post(`${API_BASE}/api/generate-key`, {
      admin_password: ADMIN_PASSWORD,
      days: days || 30,
      device_id: deviceId || 'any'
    });
    return response.data;
  } catch (e) {
    return { error: e.response?.data?.message || 'Erro ao gerar chave' };
  }
}

async function getStatus() {
  try {
    const response = await axios.get(`${API_BASE}/api/status`);
    return response.data;
  } catch (e) {
    return { status: 'offline' };
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.DISCORD_GUILD_ID), { body: commands });
    console.log('Slash commands registered!');
  } catch (e) {
    console.error('Error registering commands:', e);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'gerarchave') {
    await interaction.deferReply();
    
    const password = interaction.options.getString('senha');
    const days = interaction.options.getInteger('dias') || 30;
    const deviceId = interaction.options.getString('device') || 'any';
    
    if (password !== ADMIN_PASSWORD) {
      await interaction.editReply('❌ Senha inválida!');
      return;
    }
    
    const result = await generateKey(days, deviceId);
    
    if (result.key) {
      const embed = new EmbedBuilder()
        .setColor(0x00ff66)
        .setTitle('✅ Chave Gerada!')
        .addFields(
          { name: '🔑 Chave', value: `\`${result.key}\``, inline: false },
          { name: '⏰ Validade', value: `${result.days_remaining} dias`, inline: true },
          { name: '📅 Expira', value: new Date(result.expires_at).toLocaleDateString('pt-BR'), inline: true }
        )
        .setFooter({ text: 'ImperioStore License API' });
      
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply(`❌ Erro: ${result.error || result.message}`);
    }
  }

  if (interaction.commandName === 'status') {
    const status = await getStatus();
    const embed = new EmbedBuilder()
      .setColor(status.status === 'online' ? 0x00ff66 : 0xff4444)
      .setTitle(status.status === 'online' ? '🟢 Servidor Online' : '🔴 Servidor Offline')
      .addFields(
        { name: 'Serviço', value: status.service || 'N/A', inline: true },
        { name: 'Uptime', value: `${Math.floor(status.uptime || 0)}s`, inline: true }
      );
    
    await interaction.reply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);
