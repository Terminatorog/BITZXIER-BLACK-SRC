const {
    Message,
    Client,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    name: 'autologs',
    aliases: ['autolog'],
    cooldown: 5,
    category: 'logging',
    premium: false,

    run: async (client, message, args) => {
        // Check user permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You must have \`Manage Server\` permissions to use this command.`)
                ]
            });
        }

        // Check bot permissions
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | I need \`Administrator\` permissions to execute this command properly.`)
                ]
            });
        }

        // Check role hierarchy
        if (!client.util.hasHigher(message.member)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Your highest role must be above my highest role to use this command.`)
                ]
            });
        }

        // Check if logging system already exists
        const existingData = await client.db.get(`logs_${message.guild.id}`);
        if (existingData && Object.values(existingData).some(v => v !== null)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle('Logging System Already Configured')
                        .setDescription('This server already has a logging system set up.')
                        .addFields(
                            { name: 'How to Reset?', value: `Use \`${client.prefix}logsreset\` to reset the logging system.` },
                            { name: 'Note', value: `You'll need to delete existing log channels manually before setting up again.` }
                        )
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                ]
            });
        }

        try {
            // Create or find the logging category
            let category = message.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name === `${client.user.username}-LOGS`
            );

            if (!category) {
                category = await message.guild.channels.create({
                    name: `${client.user.username}-LOGS`,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ],
                    reason: 'Logging system setup'
                });
            }

            // Define logging channels to create
            const channelsToCreate = [
                { name: 'voicelog', description: 'Voice related events' },
                { name: 'channellog', description: 'Channel related events' },
                { name: 'rolelog', description: 'Role related events' },
                { name: 'modlog', description: 'Moderation actions' },
                { name: 'msglog', description: 'Message events' },
                { name: 'memberlog', description: 'Member related events' }
            ];

            const createdChannels = {};

            // Create all logging channels
            for (const { name, description } of channelsToCreate) {
                const channelName = `${client.user.username}-${name}`;
                
                // Check if channel already exists
                const existingChannel = message.guild.channels.cache.find(
                    ch => ch.name === channelName && ch.parentId === category.id
                );
                
                if (existingChannel) {
                    createdChannels[name] = existingChannel.id;
                    continue;
                }

                const channel = await message.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    topic: `Logs for ${description}`,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ],
                    reason: `Automatic logging channel creation for ${name}`
                });

                createdChannels[name] = channel.id;
                await client.util.sleep(1000); // Rate limit prevention
            }

            // Save to database
            await client.db.set(`logs_${message.guild.id}`, {
                voice: createdChannels.voicelog,
                channel: createdChannels.channellog,
                rolelog: createdChannels.rolelog,
                modlog: createdChannels.modlog,
                message: createdChannels.msglog,
                memberlog: createdChannels.memberlog
            });

            // Success response
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle('Logging System Setup Complete')
                        .setDescription(`Successfully created all logging channels under the \`${category.name}\` category.`)
                        .addFields(
                            { 
                                name: 'Channels Created', 
                                value: channelsToCreate.map(c => `• **${client.user.username}-${c.name}**: ${c.description}`).join('\n') 
                            },
                            { 
                                name: 'Next Steps', 
                                value: `Configure permissions for staff roles to view these channels using ${client.prefix}permissions.` 
                            }
                        )
                        .setFooter({ 
                            text: `Setup by ${message.author.tag}`, 
                            iconURL: message.author.displayAvatarURL() 
                        })
                ]
            });

        } catch (error) {
            console.error('Autologs Error:', error);
            
            // Handle rate limits specifically
            if (error.code === 429) {
                await client.util.handleRateLimit();
                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription('⚠️ | Hit rate limit, please wait and try again shortly.')
                    ]
                });
            }

            // General error response
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(' | An error occurred while setting up the logging system. Please try again later.')
                ]
            });
        }
    }
};