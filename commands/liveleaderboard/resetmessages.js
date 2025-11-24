const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'resetmessages',
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

            if (!userInput) {
                return message.channel.send('Please specify a user to reset messages for.');
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
            client.msgs.prepare(`DELETE FROM messages WHERE guildId = ? AND userId = ?`).run(message.guild.id, member.user.id);

            const embed = client.util.embed()
                .setTitle('Messages Reset')
                .setColor(client.color)
                .setDescription(`${member.user.tag}'s messages have been reset.`)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err); // Log the error for debugging
            message.channel.send('An error occurred while resetting messages.');
        }
    }
};
