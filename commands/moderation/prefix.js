const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'prefix',
    aliases: ['setprefix'],
    category: 'mod',
    premium: true,
    usage: '<new prefix> or "reset"',

    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        // Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:crosss:1375899254563799192> You need **Administrator** permissions to change the prefix.')
                ]
            });
        }

        const currentPrefix = await client.db.get(`prefix_${message.guild.id}`) || client.config.prefix;

        // Show current prefix if no args
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle('Prefix Information')
                        .setDescription(`Current prefix: \`${currentPrefix}\``)
                        .addFields(
                            { name: 'To set new prefix', value: `\`${currentPrefix}prefix <new prefix>\`` },
                            { name: 'To reset prefix', value: `\`${currentPrefix}prefix reset\`` },
                            { name: 'Rules', value: '• Max 5 characters\n• No spaces\n• No special characters (@,#,!,etc)' }
                        )
                ]
            });
        }

        // Handle reset
        if (args[0].toLowerCase() === 'reset') {
            await client.db.delete(`prefix_${message.guild.id}`);
            client.util.setPrefix(message, client);
            
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`<:Check:1375899259932508180> Prefix reset to default: \`${client.config.prefix}\``)
                ]
            });
        }

        // Validate new prefix
        const newPrefix = args[0].trim();

        // Check for multiple arguments (spaces)
        if (args.length > 1) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:crosss:1375899254563799192> Prefix cannot contain spaces.')
                ]
            });
        }

        // Length check
        if (newPrefix.length > 5) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:crosss:1375899254563799192> Prefix cannot be longer than 5 characters.')
                ]
            });
        }

        // Special characters check
        if (/[<>@#!*?^${}()|[\]\\]/.test(newPrefix)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:crosss:1375899254563799192> Prefix cannot contain special characters.')
                ]
            });
        }

        // Set new prefix
        try {
            await client.db.set(`prefix_${message.guild.id}`, newPrefix);
            client.util.setPrefix(message, client);
            
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`<:Check:1375899259932508180> Prefix updated to: \`${newPrefix}\``)
                        .setFooter({ text: `Example: ${newPrefix}help` })
                ]
            });
        } catch (error) {
            console.error('Prefix change error:', error);
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('<:crosss:1375899254563799192> Failed to update prefix. Please try again.')
                ]
            });
        }
    }
};