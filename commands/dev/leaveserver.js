const { EmbedBuilder } = require('discord.js');
const config = require(`${process.cwd()}/config.json`);

module.exports = {
    name: 'leaveserver',
    category: 'owner',
    aliases: ['leaveg', 'gleave', 'massleave'],
    description: 'Leaves one or multiple guilds',
    run: async (client, message, args) => {
        // Check if user is admin
        if (!config.admin.includes(message.author.id)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You don't have permission to use this command.`)
                ]
            });
        }

        // Show help if no arguments
        if (!args.length) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle('Leave Server Command')
                        .setDescription('Leaves one or multiple guilds')
                        .addFields(
                            { name: 'Usage', value: `\`${client.prefix}leaveserver <guildID1> [guildID2] [guildID3]...\`` },
                            { name: 'Examples', value: 
                                `\`${client.prefix}leaveserver 1234567890\n` +
                                `${client.prefix}leaveserver 1234567890 9876543210 5678901234\`` 
                            },
                            { name: 'Note', value: 'You can provide multiple guild IDs separated by spaces to leave multiple servers at once.' }
                        )
                ]
            });
        }

        const results = [];
        const failed = [];

        // Process each guild ID
        for (const id of args) {
            try {
                const guild = await client.guilds.fetch(id).catch(() => null);
                
                if (!guild) {
                    failed.push({ id, reason: 'Invalid guild ID or bot not in this server' });
                    continue;
                }

                await guild.leave();
                results.push({ id, name: guild.name });
                
                // Small delay to prevent rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error leaving guild ${id}:`, error);
                failed.push({ id, reason: error.message });
            }
        }

        // Prepare the response embed
        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle('Leave Server Results');

        if (results.length > 0) {
            embed.addFields({
                name: `${client.emoji.tick} Successfully Left (${results.length})`,
                value: results.map(g => `• **${g.name}** (\`${g.id}\`)`).join('\n') || 'None',
                inline: false
            });
        }

        if (failed.length > 0) {
            embed.addFields({
                name: `${client.emoji.cross} Failed to Leave (${failed.length})`,
                value: failed.map(f => `• \`${f.id}\`: ${f.reason}`).join('\n') || 'None',
                inline: false
            });
        }

        if (results.length === 0 && failed.length === 0) {
            embed.setDescription('No actions were taken.');
        }

        return message.channel.send({ embeds: [embed] });
    }
};