const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messages',
    category: 'leaderboard',
    premium: true,
    run: async (client, message, args) => {
        try {
            let member = await getUserFromMention(message, args[0]);
            if (!member) {
                try {
                    member = await message.guild.members.cache.get(args[0]) || message.member;
                } catch (error) {
                    return message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} | Please Provide a Valid User ID or Mention a Member.`
                                )
                        ]
                    });
                }
            }

            const today = new Date().toISOString().slice(0, 10);
            const guildId = message.guild.id;
            const memberId = member.user.id;

            const allTimeMessagesRow = client.msgs.prepare(`
                SELECT totalMessages FROM messages WHERE guildId = ? AND userId = ?
            `).get(guildId, memberId);
                
            const allTimeMessages = allTimeMessagesRow ? allTimeMessagesRow.totalMessages : 0;



            const todayMessagesRow = client.msgs.prepare(`
    SELECT dailyCount FROM dailymessages WHERE guildId = ? AND userId = ? AND date = ?
`).get(guildId, memberId, today);

            const todayMessages = todayMessagesRow ? todayMessagesRow.dailyCount : 0; // Get dailyCount or default to 0

            const embed = client.util.embed()
                .setTitle('Message Statistics')
                .setColor(client.color)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Today\'s Messages', value: `${todayMessages}`, inline: true },
                    { name: 'All-Time Messages', value: `${allTimeMessages}`, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag} | Messages are being updated in real-time` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Error in fetching messages:', err); 
            message.channel.send('An error occurred while retrieving the message count.');
        }
    }
};

function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return message.guild.members.fetch(id);
}
