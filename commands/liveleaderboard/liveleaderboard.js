module.exports = {
    name: 'liveleaderboard',
    category: 'leaderboard',
    subcommand: ['setup', 'reset', 'config'],
    premium: true,
    run: async (client, message, args) => {
        const prefix = message.guild.prefix;
        if (!message.member.permissions.has('Administrator')) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | You must have \`Administrator\` permissions to use this command.`
                        )
                ]
            });
        }

        if (!message.guild.members.me.permissions.has('Administrator')) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            });
        }

        if (!client.util.hasHigher(message.member)) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | You must have a higher role than me to use this command.`
                        )
                ]
            });
        }

        try {
            const subcommand = args[0]?.toLowerCase();
            if (subcommand === 'setup') {
                await handleSetup(client, message, args);
            } else if (subcommand === 'reset') {
                await handleReset(client, message, args);
            } else if (subcommand === 'config') {
                await handleConfig(client, message);
            } else {
                const embed = client.util.embed()
                    .setTitle('Invalid Subcommand')
                    .setColor(client.color)
                    .setDescription('Please use a valid subcommand: `setup`, `reset`, or `config`.')
                    .setFooter({ text: `Example: ${prefix}live setup messages` });
                message.channel.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error(err);
        }
    }
};
async function handleSetup(client, message, args) {
    const type = args[1]?.toLowerCase();

    // Check if the leaderboard type is valid
    if (!['messages', 'dailymessages', 'voice', 'dailyvoice'].includes(type)) {
        const embed = client.util.embed()
            .setTitle('Invalid Leaderboard Type')
            .setColor(client.color)
            .setDescription('Please specify a valid leaderboard type: `messages`, `dailymessages`, `voice`, or `dailyvoice`.')
            .setFooter({ text: `Example: ${message.guild.prefix}live setup messages` });
        return message.channel.send({ embeds: [embed] });
    }

    // Check if a leaderboard for the specified type is already running
    const existingLeaderboard = await client.livelb.prepare(`SELECT * FROM liveleaderboard WHERE guildId = ? AND type = ?`).get(message.guild.id, type);
    if (existingLeaderboard) {
        const embed = client.util.embed()
            .setTitle('Leaderboard Already Running')
            .setColor(client.color)
            .setDescription(`A live leaderboard for \`${type}\` is already running in this server.`);
        return message.channel.send({ embeds: [embed] });
    }

    // Send setup message and store leaderboard data in the database
    const embed = client.util.embed()
        .setTitle(`Live Leaderboard Setup - ${type.charAt(0).toUpperCase() + type.slice(1)}`)
        .setColor(client.color)
        .setDescription('Setting up the leaderboard...');

    const sentMessage = await message.channel.send({ embeds: [embed] });
    const insertLeaderboard = client.livelb.prepare(`
        INSERT INTO liveleaderboard (guildId, type, messageId, channelId) 
        VALUES (?, ?, ?, ?)
    `);    

    try {
        await insertLeaderboard.run(message.guild.id, type, sentMessage.id, sentMessage.channel.id);
    } catch (err) {
        console.error('Error inserting into liveleaderboard:', err);
    }

    // Function to update the leaderboard
    const updateLeaderboard = async () => {
        const storedData = await client.livelb.prepare(`SELECT * FROM liveleaderboard WHERE guildId = ? AND type = ?`).get(message.guild.id, type);
        if (!storedData) return;

        const { messageId, channelId } = storedData;

        // Fetch the channel and message for the leaderboard
        const leaderboardChannel = await message.guild.channels.fetch(channelId).catch(() => null);
        const leaderboardMessage = await leaderboardChannel?.messages.fetch(messageId).catch(() => null);

        if (!leaderboardChannel || !leaderboardMessage) {
            // If the channel or message doesn't exist, remove the leaderboard from the database
            await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ? AND type = ?`).run(message.guild.id, type);
            clearInterval(interval);
            return;
        }

        // Fetch leaderboard data based on the type
        let aggregatedData;
        switch (type) {
            case 'messages':
                aggregatedData = await client.msgs.prepare(`
                    SELECT userId, totalMessages AS total 
                    FROM messages 
                    WHERE guildId = ? 
                    ORDER BY totalMessages DESC 
                    LIMIT 10
                `).all(message.guild.id);
                break;
            case 'dailymessages':
                aggregatedData = await client.msgs.prepare(`
                    SELECT userId, SUM(dailyCount) AS total 
                    FROM dailymessages 
                    WHERE guildId = ? 
                    GROUP BY userId 
                    ORDER BY total DESC 
                    LIMIT 10
                `).all(message.guild.id);
                break;
            case 'voice':
                aggregatedData = await client.voice.prepare(`
                    SELECT userId, totalVoiceTime AS total 
                    FROM voice 
                    WHERE guildId = ? 
                    ORDER BY totalVoiceTime DESC 
                    LIMIT 10
                `).all(message.guild.id);
                break;
            case 'dailyvoice':
                aggregatedData = await client.voice.prepare(`
                    SELECT userId, SUM(dailyVoiceTime) AS total 
                    FROM dailyvoice 
                    WHERE guildId = ? 
                    GROUP BY userId 
                    ORDER BY total DESC 
                    LIMIT 10
                `).all(message.guild.id);
                break;
        }

        if (aggregatedData.length > 0) {
            // Format leaderboard based on type (messages or voice time)
            const leaderboard = aggregatedData.map((entry, index) => {
                const time = (type === 'voice' || type === 'dailyvoice') ? formatDuration(entry.total) : entry.total.toString();
                return `${index + 1}. <@${entry.userId}> | \`${entry.userId}\` **${time}** ${type}`;
            }).join('\n');

            embed.setTitle(`Live Leaderboard - ${type.charAt(0).toUpperCase() + type.slice(1)}`)
                .setDescription(leaderboard)
                .setFooter({ text : 'The leaderboards are being updated in real-time!'})
        } else {
            embed.setTitle(`Live Leaderboard - ${type.charAt(0).toUpperCase() + type.slice(1)}`)
                .setDescription('Monitoring')
                .setFooter({ text : 'The leaderboards are being updated in real-time!'})
            }

        // Update the leaderboard message
        await leaderboardMessage.edit({ embeds: [embed] });
    };

    // Run the first leaderboard update
    updateLeaderboard();

    // Set an interval to update the leaderboard every 30 seconds
    const interval = setInterval(updateLeaderboard, 30000);
}



async function handleReset(client, message, args) {
    const type = args[1]?.toLowerCase();

    if (type === 'all') {
        await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ?`).run(message.guild.id);
        const embed = client.util.embed()
            .setTitle('All Leaderboards Reset')
            .setColor(client.color)
            .setDescription('All live leaderboards and their configurations have been reset.');
        return message.channel.send({ embeds: [embed] });
    }

    if (!['messages', 'dailymessages', 'voice', 'dailyvoice'].includes(type)) {
        const embed = client.util.embed()
            .setTitle('Invalid Leaderboard Type')
            .setColor(client.color)
            .setDescription('Please specify a valid leaderboard type to reset: `messages`, `dailymessages`, `voice`, `dailyvoice`, or use `all` to reset all leaderboards.')
            .setFooter({ text: `Example: ${message.guild.prefix}live reset messages or ${message.guild.prefix}live reset all` });

        return message.channel.send({ embeds: [embed] });
    }

    await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ? AND type = ?`).run(message.guild.id,type);

    const embed = client.util.embed()
        .setTitle('Leaderboard Reset')
        .setColor(client.color)
        .setDescription(`The live leaderboard for \`${type}\` and its configuration have been reset.`);

    return message.channel.send({ embeds: [embed] });
}
async function handleConfig(client, message) {
    // Fetch the leaderboard configuration for the current guild
    const storedData = await client.livelb.prepare(`SELECT * FROM liveleaderboard WHERE guildId = ?`).all(message.guild.id);

    // Check if no leaderboards are configured
    if (storedData.length === 0) {
        const embed = client.util.embed()
            .setTitle('No Leaderboards Configured')
            .setColor(client.color)
            .setDescription('No live leaderboards are currently configured.');
        return message.channel.send({ embeds: [embed] });
    }

    // Construct the configuration message
    const configMessage = storedData.map(({ type, channelId }) => {
        const channel = message.guild.channels.cache.get(channelId);
        return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${channel ? `<#${channelId}>` : 'Not set'}`;
    }).join('\n') || 'Not set';

    // Create and send the embed message with configurations
    const embed = client.util.embed()
        .setTitle('Live Leaderboard Configurations')
        .setColor(client.color)
        .setDescription(configMessage);

    message.channel.send({ embeds: [embed] });
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
