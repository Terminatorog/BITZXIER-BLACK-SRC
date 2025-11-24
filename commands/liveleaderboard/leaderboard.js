const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    category: 'leaderboard',
    subcommand: ['messages', 'dailymessages', 'voice', 'dailyvoice'],
    premium: true,
    run: async (client, message, args) => {
        try {
            const type = args[0]?.toLowerCase();

            if (!['messages', 'dailymessages', 'voice', 'dailyvoice'].includes(type)) {
                return message.channel.send('Please specify a valid leaderboard type: messages, dailymessages, voice, or dailyvoice.');
            }

            const guildId = message.guild.id;
            let rows;

            // Retrieve data from the corresponding table based on the type
            if (type === 'messages') {
                rows = client.msgs.prepare('SELECT userId, SUM(totalMessages) as total FROM messages WHERE guildId = ? GROUP BY userId ORDER BY total DESC').all(guildId);
            } else if (type === 'dailymessages') {
                const today = new Date().toISOString().slice(0, 10);
                rows = client.msgs.prepare('SELECT userId, SUM(dailyCount) as total FROM dailymessages WHERE guildId = ? AND date = ? GROUP BY userId ORDER BY total DESC').all(guildId, today);
            } else if (type === 'voice') {
                rows = client.voice.prepare('SELECT userId, SUM(totalVoiceTime) as total FROM voice WHERE guildId = ? GROUP BY userId ORDER BY total DESC').all(guildId);
            } else if (type === 'dailyvoice') {
                const today = new Date().toISOString().slice(0, 10);
                rows = client.voice.prepare('SELECT userId, SUM(dailyVoiceTime) as total FROM dailyvoice WHERE guildId = ? AND date = ? GROUP BY userId ORDER BY total DESC').all(guildId, today);
            }

            // Format leaderboard data
            const leaderboard = rows.map((entry, index) => {
                const time = type.includes('voice') ? formatDuration(entry.total) : entry.total.toString();
                return `${index + 1}. <@${entry.userId}> - **${time}**`;
            });

            await paginateLeaderboard(leaderboard, message, client, type);

        } catch (err) {
            console.error(err);
        }
    }
};

async function paginateLeaderboard(leaderboard, message, client, type) {
    const embeds = [];
    const itemsPerPage = 10;

    for (let i = 0; i < leaderboard.length; i += itemsPerPage) {
        const current = leaderboard.slice(i, i + itemsPerPage);
        const embed = new EmbedBuilder()
            .setTitle(`Leaderboard - ${type.charAt(0).toUpperCase() + type.slice(1)}`)
            .setColor(client.color)
            .setDescription(current.join('\n'))
            .setFooter({ text: `Page ${embeds.length + 1}/${Math.ceil(leaderboard.length / itemsPerPage)}` });

        embeds.push(embed);
    }

    if (embeds.length === 0) {
        return message.channel.send({ embeds: [new EmbedBuilder().setDescription('No data available.').setColor(client.color)] });
    }

    let page = 0;

    const buttonFirst = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('first').setEmoji('⏮').setDisabled(page === 0);
    const buttonBack = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('back').setEmoji('◀').setDisabled(page === 0);
    const buttonStop = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('stop').setEmoji('⏹');
    const buttonNext = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('next').setEmoji('▶️').setDisabled(page === embeds.length - 1);
    const buttonLast = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('last').setEmoji('⏭').setDisabled(page === embeds.length - 1);

    const row = new ActionRowBuilder().addComponents(buttonFirst, buttonBack, buttonStop, buttonNext, buttonLast);

    const currentMessage = await message.channel.send({ embeds: [embeds[page]], components: [row] });

    const collector = currentMessage.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: `You are not allowed to use this interaction`, ephemeral: true });
        }
        if (interaction.customId === 'first') {
            page = 0;
        } else if (interaction.customId === 'back') {
            page = Math.max(page - 1, 0);
        } else if (interaction.customId === 'next') {
            page = Math.min(page + 1, embeds.length - 1);
        } else if (interaction.customId === 'last') {
            page = embeds.length - 1;
        } else if (interaction.customId === 'stop') {
            return collector.stop();
        }

        buttonFirst.setDisabled(page === 0);
        buttonBack.setDisabled(page === 0);
        buttonNext.setDisabled(page === embeds.length - 1);
        buttonLast.setDisabled(page === embeds.length - 1);

        await interaction.update({ embeds: [embeds[page]], components: [row] });
    });

    collector.on('end', () => {
        currentMessage.edit({ components: [] });
    });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`;
}

