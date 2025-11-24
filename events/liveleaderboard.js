const cron = require('node-cron');


module.exports = async (client) => {
     client.voiceTimes = new Map(); // To store user voice join times

    client.once('ready', async () => {
        await client.guilds.fetch();
        const guilds = client.guilds.cache.map(guild => guild.id);

        for (const guildId of guilds) {
            let check = await client.db.get(`blacklistserver_${client?.user?.id}`) || [];
            if (check.includes(guildId)) return;

            const storedLeaderboards = await client.livelb.prepare(`SELECT * FROM liveleaderboard WHERE guildId = ?`).all(guildId);
            if (storedLeaderboards.length) {
                for (const data of storedLeaderboards) {
                    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
                    if (!guild) {
                        await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ?`).run(guildId);
                        continue;
                    }

                    const channel = guild.channels.cache.get(data.channelId) || await guild.channels.fetch(data.channelId).catch(() => null);
                    if (!channel) {
                        await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ?`).run(guildId);
                        continue;
                    }

                    const sentMessage = channel.messages.cache.get(data.messageId) || await channel.messages.fetch(data.messageId).catch(() => null);
                    if (!sentMessage) {
                        await client.livelb.prepare(`DELETE FROM liveleaderboard WHERE guildId = ?`).run(guildId);
                        continue;
                    }

                    const embed = client.util.embed().setColor(client.color);

                    const updateLeaderboard = async () => {
                        try {
                            const type = data.type;  // Get leaderboard type from stored data
                            let leaderboardData;

                            switch (type) {
                                case 'messages':
                                    leaderboardData = await client.msgs.prepare(`
                                        SELECT userId, totalMessages AS total 
                                        FROM messages 
                                        WHERE guildId = ? 
                                        ORDER BY totalMessages DESC 
                                        LIMIT 10
                                    `).all(guildId);
                                    break;
                                case 'dailymessages':
                                    leaderboardData = await client.msgs.prepare(`
                                        SELECT userId, SUM(dailyCount) AS total 
                                        FROM dailymessages 
                                        WHERE guildId = ? 
                                        GROUP BY userId 
                                        ORDER BY total DESC 
                                        LIMIT 10
                                    `).all(guildId);
                                    break;
                                case 'voice':
                                    leaderboardData = await client.voice.prepare(`
                                        SELECT userId, totalVoiceTime AS total 
                                        FROM voice 
                                        WHERE guildId = ? 
                                        ORDER BY totalVoiceTime DESC 
                                        LIMIT 10
                                    `).all(guildId);
                                    break;
                                case 'dailyvoice':
                                    leaderboardData = await client.voice.prepare(`
                                        SELECT userId, SUM(dailyVoiceTime) AS total 
                                        FROM dailyvoice 
                                        WHERE guildId = ? 
                                        GROUP BY userId 
                                        ORDER BY total DESC 
                                        LIMIT 10
                                    `).all(guildId);
                                    break;
                                default:
                                    return;
                            }

                            const sorted = leaderboardData.map((entry, index) => {
                                let formattedValue;
                                if (type === 'voice' || type === 'dailyvoice') {
                                    formattedValue = formatDuration(entry.total);  // Format duration for voice data
                                } else {
                                    formattedValue = entry.total.toString();  // Show value normally for messages
                                }

                                return `${index + 1}. <@${entry.userId}> | \`${entry.userId}\` **${formattedValue}** ${type}`;
                            }).join('\n');

                            if (sorted.length > 0) {
                                embed.setTitle('Live Leaderboard')
                                    .setDescription(sorted)
                                    .setFooter({ text: 'The leaderboards are being updated in real-time!' });
                            } else {
                                embed.setTitle('Monitoring')
                                    .setDescription('No data available yet.')
                                    .setFooter({ text: 'The leaderboards are being updated in real-time!' });
                            }

                            await sentMessage.edit({ embeds: [embed] });
                        } catch (err) {
                            console.error('Error updating leaderboard:', err);
                        }
                    };

                    updateLeaderboard();
                    setInterval(updateLeaderboard, 30000); // Update leaderboard every 10 seconds
                }
            }
        }

        cron.schedule(
            '0 0 * * *',
            async () => {
                console.log('Daily cleanup job executed.');
                for (const guildId of client.guilds.cache.map(guild => guild.id)) {
                    try {
                        await client.msgs.prepare(`
                            DELETE FROM dailymessages`).run();   
                        await client.voice.prepare(`
                            DELETE FROM dailyvoice`).run();
                        
                    } catch (err) {
                        console.error(`Error during cleanup for guild ${guildId}:`, err);
                    }
                }
            },
            { scheduled: true, timezone: 'Asia/Kolkata' }
        );
    });

    // Count message events
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;
        const today = new Date().toISOString().slice(0, 10);

        try {
            client.msgs.prepare(`
                INSERT INTO messages (guildId, userId, totalMessages) 
                VALUES (?, ?, 1) 
                ON CONFLICT(guildId, userId) 
                DO UPDATE SET totalMessages = totalMessages + 1
            `).run(guildId, userId);

            client.msgs.prepare(`
                INSERT INTO dailymessages (guildId, userId, date, dailyCount) 
                VALUES (?, ?, ?, 1) 
                ON CONFLICT(guildId, userId, date) 
                DO UPDATE SET dailyCount = dailyCount + 1
            `).run(guildId, userId, today);
        } catch (err) {
            console.error('Error updating message counts:', err);
        }
    });

   // Track voice state updates
client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.member.id;
    const guildId = newState.guild.id;

    if (newState.member.user.bot) return;

    const currentTime = Date.now();

    // If user joins a channel and is not deafened
    if (newState.channelId && oldState.channelId !== newState.channelId && !newState.selfDeaf && !newState.serverDeaf) {
        await client.voice.prepare(`
            INSERT INTO voice (guildId, userId, totalVoiceTime) 
            VALUES (?, ?, 0) 
            ON CONFLICT(guildId, userId) 
            DO UPDATE SET totalVoiceTime = totalVoiceTime
        `).run(guildId, userId);

        client.voiceTimes.set(`${guildId}_${userId}`, currentTime);
    }

    // If user leaves the channel or becomes deafened
    if ((!newState.channelId && oldState.channelId) || ((newState.selfDeaf || newState.serverDeaf) && !(oldState.selfDeaf || oldState.serverDeaf))) {
        const joinTime = client.voiceTimes.get(`${guildId}_${userId}`);
        if (joinTime) {
            const duration = currentTime - joinTime;

            await client.voice.prepare(`
                UPDATE voice SET totalVoiceTime = totalVoiceTime + ? 
                WHERE guildId = ? AND userId = ?
            `).run(duration, guildId, userId);

            const today = new Date().toISOString().slice(0, 10);

            await client.voice.prepare(`
                INSERT INTO dailyvoice (guildId, userId, date, dailyVoiceTime)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(guildId, userId, date)
                DO UPDATE SET dailyVoiceTime = dailyVoiceTime + ?
            `).run(guildId, userId, today, duration, duration);

            client.voiceTimes.delete(`${guildId}_${userId}`);
        }
    }

    // If user gets undeafened while in a voice channel
    if ((!newState.selfDeaf && !newState.serverDeaf) && (oldState.selfDeaf || oldState.serverDeaf) && newState.channelId) {
        client.voiceTimes.set(`${guildId}_${userId}`, currentTime);
    }
});


}

// Function to format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`;
}