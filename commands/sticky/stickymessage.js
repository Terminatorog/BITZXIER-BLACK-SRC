const { ActionRowBuilder, ButtonBuilder, ButtonStyle , EmbedBuilder } = require('discord.js');
const Sticky = require('../../models/sticky');

module.exports = {
    name: 'stickymessage',
    aliases: ['stickymsg', 'sticky'],
    description: 'Manage sticky messages in a channel.',
    category: 'sticky',
    subcommand: ['add', 'remove', 'list', 'reset'],
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
                    new EmbedBuilder()
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

        if (!args.length) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Sticky Message Management')
                        .setColor(client.color)
                        .setDescription('Please provide a valid subcommand.\n\n**Available Subcommands:**\n`add`, `remove`, `list`, `reset`')
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ]
            });
        }

        const subcommand = args.shift().toLowerCase();

        switch (subcommand) {
            case 'add':
                await handleAdd(client, message, args);
                break;
            case 'remove':
                await handleRemove(client, message, args);
                break;
            case 'list':
                await handleList(client, message);
                break;
            case 'reset':
                await handleReset(client, message);
                break;
            default:
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Invalid Subcommand')
                            .setColor(client.color)
                            .setDescription('Please use one of the following subcommands:\n\n`add`, `remove`, `list`, `reset`')
                            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                            .setTimestamp()
                    ]
                });
        }
    },
};

async function handleAdd(client, message, args) {
    if (!args.length) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Missing Arguments')
                    .setColor(client.color)
                    .setDescription('Please provide the sticky message content.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    const content = args.join(' ');
    if (content.length > 1950) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Sticky Message Too Long')
                    .setColor(client.color)
                    .setDescription('Sticky messages cannot exceed 1950 characters.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    const existingSticky = await Sticky.findOne({ guildId: message.guild.id, channelId: message.channel.id });
    if (existingSticky) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Sticky Message Exists')
                    .setColor(client.color)
                    .setDescription('A sticky message is already set in this channel. Remove it before adding a new one.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    const stickyCount = await Sticky.countDocuments({ guildId: message.guild.id });
    if (stickyCount >= 40) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Sticky Message Limit Reached')
                    .setColor(client.color)
                    .setDescription('You have reached the limit of 40 sticky messages for this guild.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    await Sticky.create({ guildId: message.guild.id, channelId: message.channel.id, content });

    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('Sticky Message Set')
                .setColor(client.color)
                .setDescription('The sticky message has been set successfully.')
                .addFields({ name: 'Content', value: content })
                .setFooter({ text: `Set by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
        ]
    });
}

async function handleRemove(client, message, args) {
    const channel = getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0])

    if (!channel || channel.type !== 0) { // Check if the channel exists and is a text channel
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Invalid Channel')
                    .setColor(client.color)
                    .setDescription('Please provide a valid text channel ID or mention a valid text channel.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    const sticky = await Sticky.findOneAndDelete({ guildId: message.guild.id, channelId: channel.id });
    if (!sticky) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('No Sticky Message Found')
                    .setColor(client.color)
                    .setDescription(`There is no sticky message set for ${channel}.`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('Sticky Message Removed')
                .setColor(client.color)
                .setDescription(`The sticky message has been removed successfully from ${channel}.`)
                .setFooter({ text: `Removed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
        ]
    });
}

async function handleList(client, message) {
    const stickies = await Sticky.find({ guildId: message.guild.id });
    if (!stickies.length) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('No Sticky Messages Found')
                    .setColor(client.color)
                    .setDescription('There are no sticky messages set for this guild.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }

    const stickyList = stickies.map(sticky => {
        const channel = message.guild.channels.cache.get(sticky.channelId);
        return `**Channel:** ${channel ? channel.name : `Unknown Channel (ID: ${sticky.channelId})`}\n**Content:** ${sticky.content}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
        .setTitle('Sticky Messages')
        .setColor(client.color)
        .setDescription(stickyList)
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

    return message.client.util.ExcelPagination(embed, message.client, message)
}

async function handleReset(client, message) {
    const stickies = await Sticky.find({ guildId: message.guild.id });
    if (!stickies.length) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('No Sticky Messages Found')
                    .setColor(client.color)
                    .setDescription('There are no sticky messages set for this guild.')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp()
            ]
        });
    }
    await Sticky.deleteMany({ guildId: message.guild.id });
    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('All Sticky Messages Reset')
                .setColor(client.color)
                .setDescription('All sticky messages have been reset for this guild.')
                .setFooter({ text: `Reset by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
        ]
    });
}

function getChannelFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<#(\d+)>$/);
    if (!matches) return null;

    const channelId = matches[1];
    return message.guild.channels.cache.get(channelId);
}
