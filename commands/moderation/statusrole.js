const StatusRole = require('../../models/Statusrole');

module.exports = {
    name: 'statusrole',
    aliases: ['sr'],
    description: 'Manage the automatic role assignment based on user status keyword.',
    cooldown: 6,
    category: 'mod',
    usage: 'statusrole <role|channel|keyword> <set|view|reset> [value]',
    run: async (client, message, args) => {
        // Debug: Command triggered
        console.log('Statusrole command triggered');
        await message.channel.send('Debug: Statusrole command triggered');

        // Permission check
        if (
            message.author.id !== message.guild.ownerId &&
            !message.member.permissions.has('Administrator')
        ) {
            console.log('Debug: Permission denied');
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Only Server Owner or Admins can use this command!`),
                ],
            });
        }

        const sub = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();
        const value = args[2];
        const guildId = message.guild.id;

        console.log('Debug: Args', { sub, action, value });

        let data;
        try {
            data = await StatusRole.findOne({ guildId });
            console.log('Debug: DB fetch result', data);
        } catch (err) {
            console.error('Debug: DB error', err);
            return message.channel.send('Debug: Database error!');
        }
        if (!data) {
            data = new StatusRole({ guildId });
            console.log('Debug: Created new StatusRole doc');
        }

        // Helper for saving and responding
        async function saveAndReply(desc) {
            try {
                await data.save();
                console.log('Debug: Data saved');
            } catch (err) {
                console.error('Debug: Save error', err);
                return message.channel.send('Debug: Save error!');
            }
            return message.channel.send({
                embeds: [client.util.embed().setColor(client.color).setDescription(desc)],
            });
        }

        if (!sub || !['role', 'channel', 'keyword'].includes(sub)) {
            console.log('Debug: Showing help embed');
            const embed = client.util.embed()
                .setColor(client.color)
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setTitle('Status Role Configuration')
                .setDescription('Manage the automatic role assignment based on user status keyword.\n\n**Subcommands:**')
                .addFields([
                    { name: '`statusrole role set <role>`', value: 'Set the role to be assigned when the keyword is present in a user\'s status.' },
                    { name: '`statusrole role view`', value: 'View the currently configured status role.' },
                    { name: '`statusrole role reset`', value: 'Reset the configured status role.' },
                    { name: '\u200B', value: '\u200B' }, // Spacer
                    { name: '`statusrole channel set <channel>`', value: 'Set the log channel for status role events.' },
                    { name: '`statusrole channel view`', value: 'View the currently configured log channel.' },
                    { name: '`statusrole channel reset`', value: 'Reset the log channel.' },
                    { name: '\u200B', value: '\u200B' }, // Spacer
                    { name: '`statusrole keyword set <keyword>`', value: 'Set the keyword to trigger the status role.' },
                    { name: '`statusrole keyword view`', value: 'View the currently configured keyword.' },
                    { name: '`statusrole keyword reset`', value: 'Reset the keyword.' }
                ])
                .setFooter({
                    text: 'Note: Users will only receive the role if their custom status contains the configured keyword.',
                    iconURL: client.user.displayAvatarURL()
                });
            return message.channel.send({ embeds: [embed] });
        }

        // ROLE
        if (sub === 'role') {
            if (action === 'set') {
                let role;
                // Try to get role from mention first
                if (message.mentions.roles.size > 0) {
                    role = message.mentions.roles.first();
                } else {
                    // Try to get role from ID
                    role = message.guild.roles.cache.get(value);
                    if (!role) {
                        // Try to fetch role if not in cache
                        try {
                            role = await message.guild.roles.fetch(value);
                        } catch (err) {
                            console.error('Error fetching role:', err);
                        }
                    }
                }

                if (!role) {
                    return message.channel.send({
                        embeds: [client.util.embed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Please mention a valid role or provide a valid role ID!`)
                        ],
                    });
                }

                // Check for dangerous permissions
                const dangerousPermissions = [
                    'Administrator',
                    'ManageGuild',
                    'ManageRoles',
                    'ManageChannels',
                    'ManageEmojisAndStickers',
                    'ManageWebhooks',
                    'ManageGuildExpressions',
                    'ManageNicknames',
                    'ManageGuildScheduledEvents',
                    'BanMembers',
                    'KickMembers',
                    'ModerateMembers'
                ];

                const hasDangerousPermission = dangerousPermissions.some(perm => role.permissions.has(perm));
                if (hasDangerousPermission) {
                    return message.channel.send({
                        embeds: [client.util.embed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Cannot set this role as it has dangerous permissions! Please choose a role with fewer permissions.`)
                            .addFields([
                                { name: 'Dangerous Permissions', value: dangerousPermissions.join(', ') }
                            ])
                        ],
                    });
                }

                data.roleId = role.id;
                return saveAndReply(`${client.emoji.tick} | Vanity role set to <@&${role.id}>`);
            } else if (action === 'view') {
                if (!data.roleId) {
                    return message.channel.send({
                        embeds: [client.util.embed().setColor(client.color).setDescription(`${client.emoji.cross} | No vanity role set!`)],
                    });
                }
                return message.channel.send({
                    embeds: [client.util.embed().setColor(client.color).setDescription(`Current vanity role: <@&${data.roleId}>`)],
                });
            } else if (action === 'reset') {
                data.roleId = undefined;
                return saveAndReply(`${client.emoji.tick} | Vanity role has been reset!`);
            }
        } else if (sub === 'channel') {
            if (action === 'set') {
                let channel;
                // Try to get channel from mention first
                if (message.mentions.channels.size > 0) {
                    channel = message.mentions.channels.first();
                } else {
                    // Try to get channel from ID
                    channel = message.guild.channels.cache.get(value);
                    if (!channel) {
                        // Try to fetch channel if not in cache
                        try {
                            channel = await message.guild.channels.fetch(value);
                        } catch (err) {
                            console.error('Error fetching channel:', err);
                        }
                    }
                }

                if (!channel) {
                    return message.channel.send({
                        embeds: [client.util.embed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Please mention a valid channel or provide a valid channel ID!`)
                        ],
                    });
                }

                // Check if channel is text-based
                if (!channel.isTextBased()) {
                    return message.channel.send({
                        embeds: [client.util.embed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | The channel must be a text channel!`)
                        ],
                    });
                }

                data.logChannelId = channel.id;
                return saveAndReply(`${client.emoji.tick} | Log channel set to <#${channel.id}>`);
            } else if (action === 'view') {
                if (!data.logChannelId) {
                    return message.channel.send({
                        embeds: [client.util.embed().setColor(client.color).setDescription(`${client.emoji.cross} | No log channel set!`)],
                    });
                }
                return message.channel.send({
                    embeds: [client.util.embed().setColor(client.color).setDescription(`Current log channel: <#${data.logChannelId}>`)],
                });
            } else if (action === 'reset') {
                data.logChannelId = undefined;
                return saveAndReply(`${client.emoji.tick} | Log channel has been reset!`);
            }
        } else if (sub === 'keyword') {
            if (action === 'set') {
                console.log('Debug: Keyword set', value);
                if (!value) {
                    return message.channel.send({
                        embeds: [client.util.embed().setColor(client.color).setDescription(`${client.emoji.cross} | Please provide a keyword!`)],
                    });
                }
                data.keyword = value;
                return saveAndReply(`${client.emoji.tick} | Keyword set to "${value}"`);
            } else if (action === 'view') {
                console.log('Debug: Keyword view', data.keyword);
                if (!data.keyword) {
                    return message.channel.send({
                        embeds: [client.util.embed().setColor(client.color).setDescription(`${client.emoji.cross} | No keyword set!`)],
                    });
                }
                return message.channel.send({
                    embeds: [client.util.embed().setColor(client.color).setDescription(`Current keyword: "${data.keyword}"`)],
                });
            } else if (action === 'reset') {
                data.keyword = undefined;
                console.log('Debug: Keyword reset');
                return saveAndReply(`${client.emoji.tick} | Keyword has been reset!`);
            }
        }

        // If action not recognized
        console.log('Debug: Invalid action');
        return message.channel.send({
            embeds: [client.util.embed().setColor(client.color).setDescription(`${client.emoji.cross} | Invalid action!`)],
        });
    },
};

