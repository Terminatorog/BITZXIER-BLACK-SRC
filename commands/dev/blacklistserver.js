const { MessageEmbed } = require('discord.js');
this.config = require(`${process.cwd()}/config.json`);

module.exports = {
    name: 'blacklistserver',
    aliases: ['bs'],
    category: 'owner',
    run: async (client, message, args) => {
        // Owner check
        if (!this.config.owner.includes(message.author.id)) return;

        const embed = client.util.embed().setColor(client.color);
        const prefix = message.guild.prefix;

        // No arguments provided
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setDescription(
                            `Please provide the required arguments.\n${prefix}blacklistserver \`<add/remove/list>\` \`<server id>\``
                        )
                ]
            });
        }

        // List option
        if (args[0].toLowerCase() === 'list') {
            let listing = await client.db.get(`blacklistserver_${client.user.id}`) || [];
            let info = [];
            
            if (listing.length < 1) {
                info.push('No servers are blacklisted.');
            } else {
                // Process each server in the blacklist
                for (let i = 0; i < listing.length; i++) {
                    try {
                        const guild = await client.guilds.fetch(listing[i]).catch(() => null);
                        if (guild) {
                            info.push(`${i + 1}) ${guild.name} (${guild.id})`);
                        } else {
                            // Remove unavailable guilds from blacklist
                            listing = listing.filter(id => id !== listing[i]);
                            await client.db.set(`blacklistserver_${client.user.id}`, listing);
                            i--; // Adjust index after removal
                        }
                    } catch (error) {
                        console.error(`Error fetching guild ${listing[i]}:`, error);
                    }
                }
            }

            return client.util.pagination(message, info, '**Blacklisted Servers**');
        }

        // Add/remove operations
        if (!args[1]) {
            return message.channel.send({
                embeds: [
                    embed
                        .setDescription(
                            `Please provide a server ID.\n${prefix}blacklistserver \`<add/remove>\` \`<server id>\``
                        )
                ]
            });
        }

        // Validate server ID
        let guild;
        try {
            guild = await client.guilds.fetch(args[1]);
        } catch (error) {
            return message.channel.send({
                embeds: [
                    embed
                        .setDescription(
                            `Invalid server ID provided.\n${prefix}blacklistserver \`<add/remove>\` \`<valid server id>\``
                        )
                ]
            });
        }

        // Get current blacklist
        let blacklist = await client.db.get(`blacklistserver_${client.user.id}`) || [];
        const operation = args[0].toLowerCase();

        // Add to blacklist
        if (['add', 'a', '+'].includes(operation)) {
            if (blacklist.includes(guild.id)) {
                return message.channel.send({
                    embeds: [
                        embed
                            .setDescription(
                                `${client.emoji.cross} | **${guild.name} (${guild.id})** is already blacklisted.`
                            )
                    ]
                });
            }

            blacklist.push(guild.id);
            blacklist = [...new Set(blacklist)]; // Remove duplicates
            await client.db.set(`blacklistserver_${client.user.id}`, blacklist);
            client.util.blacklistserver(); // Update cache if needed

            return message.channel.send({
                embeds: [
                    embed
                        .setDescription(
                            `${client.emoji.tick} | **${guild.name} (${guild.id})** has been added to the blacklist.`
                        )
                ]
            });
        }

        // Remove from blacklist
        if (['remove', 'r', '-'].includes(operation)) {
            if (!blacklist.includes(guild.id)) {
                return message.channel.send({
                    embeds: [
                        embed
                            .setDescription(
                                `${client.emoji.cross} | **${guild.name} (${guild.id})** is not blacklisted.`
                            )
                    ]
                });
            }

            blacklist = blacklist.filter(id => id !== guild.id);
            await client.db.set(`blacklistserver_${client.user.id}`, blacklist);
            client.util.blacklistserver(); // Update cache if needed

            return message.channel.send({
                embeds: [
                    embed
                        .setDescription(
                            `${client.emoji.tick} | **${guild.name} (${guild.id})** has been removed from the blacklist.`
                        )
                ]
            });
        }

        // Invalid operation
        return message.channel.send({
            embeds: [
                embed
                    .setDescription(
                        `Invalid operation. Usage:\n${prefix}blacklistserver \`<add/remove/list>\` \`<server id>\``
                    )
            ]
        });
    }
};