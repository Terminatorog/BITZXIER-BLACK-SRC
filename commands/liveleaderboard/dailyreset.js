const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'resetdaily',
    category: 'leaderboard',
    premium: true,
    subcommand: ['messages', 'voices', 'all'],
    run: async (client, message, args) => {
        if (!'1143155471159664710'.includes(message.author.id) && !message.member.permissions.has('Administrator')) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You must have \`Administrator\` permissions to use this command.`)
                ]
            });
        }

        if (!message.guild.members.me.permissions.has('Administrator')) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | I don't have \`Administrator\` permissions to execute this command.`)
                ]
            });
        }

        if (!'1143155471159664710'.includes(message.author.id) && !client.util.hasHigher(message.member)) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You must have a higher role than me to use this command.`)
                ]
            });
        }

        const subcommand = args[0]?.toLowerCase();

        if (['messages', 'voice', 'all'].includes(subcommand)) {
            await confirmReset(client, message, subcommand);
        } else {
            const embed = client.util.embed()
                .setTitle('Invalid Subcommand')
                .setColor(client.color)
                .setDescription('Please use a valid subcommand: `messages`, `voices`, or `all`.')
                .setFooter({ text: `Example: ${prefix}resetdaily messages` });
            message.channel.send({ embeds: [embed] });
        }
    }
};

async function confirmReset(client, message, type) {
    const embed = client.util.embed()
        .setTitle(`Confirm Reset: ${type.charAt(0).toUpperCase() + type.slice(1)}`)
        .setColor(client.color)
        .setDescription(`Are you sure you want to reset the daily data for **${type}** in this server?`);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('confirm_no')
                .setLabel('No')
                .setStyle(ButtonStyle.Danger)
        );

    const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === message.author.id;
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        if (i.customId === 'confirm_yes') {
            await performReset(client, message.guild.id, type);
            await i.update({ embeds: [client.util.embed().setColor(client.color).setDescription(`The daily data for **${type}** has been reset in this server.`)], components: [] });
        } else if (i.customId === 'confirm_no') {
            await i.update({ content: 'Reset action cancelled.', components: [] });
        }
    });

    collector.on('end', collected => {
        if (!collected.size) {
            sentMessage.edit({ content: 'No response received. Reset action cancelled.', components: [] });
        }
    });
}

async function performReset(client, guildId, type) {
    const today = new Date().toISOString().slice(0, 10);
    try {
        if (type === 'all' || type === 'messages') {
            const deleteDailyMessagesStmt = client.msgs.prepare('DELETE FROM dailymessages WHERE guildId = ? AND date = ?');
            deleteDailyMessagesStmt.run(guildId, today);
        }

        if (type === 'all' || type === 'voice') {
            const deleteDailyVoiceStmt = client.voice.prepare('DELETE FROM dailyvoice WHERE guildId = ? AND date = ?');
            deleteDailyVoiceStmt.run(guildId, today);
        }
    } catch (err) {
        console.error(err); // Log the error for debugging
        return;
    }
}
