const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'removemessages',
    category: 'leaderboard',
    premium: true,
    run: async (client, message, args) => {
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
            const userInput = args[0];
            const amount = parseInt(args[1], 10);

            if (!userInput || isNaN(amount)) {
                return message.channel.send('Please specify a user and a valid amount to remove.');
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

      // Check current messages from the messages table
const allTimeMessagesRow =  client.msgs.prepare(`
    SELECT totalMessages FROM messages WHERE guildId = ? AND userId = ?
`).get(message.guild.id, member.user.id);

const currentMessages = allTimeMessagesRow?.totalMessages || 0; // Fetch the total messages or default to 0

// Calculate new message count
const newMessageCount = Math.max(0, currentMessages - amount); // Ensure it's not less than 0

// Update the messages table only if there is a change
    if (newMessageCount !== currentMessages) {
    client.msgs.prepare(`
        UPDATE messages SET totalMessages = ? WHERE guildId = ? AND userId = ?
    `).run(newMessageCount, message.guild.id, member.user.id);
}


            const embed = client.util.embed()
                .setTitle('Messages Removed')
                .setColor(client.color)
                .setDescription(`${amount} messages have been removed from ${member.user.tag}.`)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err); // Log the error for debugging
            message.channel.send('An error occurred while removing messages.');
        }
    }
};
