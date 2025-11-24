const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'addmessages',
    category: 'leaderboard',
    premium: true,
    run: async (client, message, args) => {
        if (!message.member.permissions.has('Administrator')) {
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

        if (!client.util.hasHigher(message.member)) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You must have a higher role than me to use this command.`)
                ]
            });
        }

        try {
            const userInput = args[0];
            const amount = parseInt(args[1], 10);

            if (!userInput || isNaN(amount)) {
                return message.channel.send('Please specify a user and a valid amount to add.');
            }

            let userId;
            if (userInput.startsWith('<@') && userInput.endsWith('>')) {
                userId = userInput.replace(/[<@!>]/g, '');
            } else {
                userId = userInput;
            }

            const member = message.guild.members.cache.get(userId);
            if (!member) {
                return message.channel.send('This user is not a member of the server.');
            }

            // Check current message count in the database
            const stmt = client.msgs.prepare('SELECT totalMessages FROM messages WHERE guildId = ? AND userId = ?');
            const row = stmt.get(message.guild.id, member.user.id);
            const currentMessages = row ? row.totalMessages : 0;

            // Update the message count
            const newMessageCount = currentMessages + amount;

            const upsertStmt = client.msgs.prepare(`
                INSERT INTO messages (guildId, userId, totalMessages) 
                VALUES (?, ?, ?) 
                ON CONFLICT(guildId, userId) 
                DO UPDATE SET totalMessages = ?;
            `);
            upsertStmt.run(message.guild.id, member.id, newMessageCount, newMessageCount);

            const embed = client.util.embed()
                .setTitle('Messages Added')
                .setColor(client.color)
                .setDescription(`${amount} messages have been added to ${member.user.tag}.`)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err); // Log the error for debugging
            message.channel.send('An error occurred while adding messages.');
        }
    }
};
