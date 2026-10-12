import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    new SlashCommandBuilder().setName('share').setDescription('Converts a music link from one streaming platform to all streaming platforms').addStringOption(option => option.setName('link').setDescription('Paste your song link from Spotify, Apple Music, YouTube, etc.').setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash command...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully registed slash command.');
    } catch (error) {
        console.error('Error registering slash command:', error);
    }
})();