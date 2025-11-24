const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'banner',
    aliases: [],
    category: 'info',
    premium: false,

    run: async (client, message, args) => {
        try {
            let targetUser;

            // Check if user is provided by mention or ID
            if (args[0]) {
                // Try to get user from mention first
                const mentionMatch = args[0].match(/^<@!?(\d+)>$/);
                if (mentionMatch) {
                    targetUser = await client.users.fetch(mentionMatch[1]).catch(() => null);
                }
                
                // If not found via mention, try as raw ID
                if (!targetUser) {
                    targetUser = await client.users.fetch(args[0]).catch(() => null);
                }
            }

            // If no valid user found in args, default to message author
            if (!targetUser) {
                targetUser = message.author;
            }

            // Fetch user data to get the user banner
            const userData = await axios
                .get(`https://discord.com/api/users/${targetUser.id}`, {
                    headers: {
                        Authorization: `Bot ${client.token}`,
                    },
                })
                .then((res) => res.data)
                .catch(() => null);

            // Get user banner URL
            const userBanner = userData?.banner 
                ? `https://cdn.discordapp.com/banners/${targetUser.id}/${userData.banner}${
                    userData.banner.startsWith('a_') ? '.gif' : '.png'
                }?size=4096`
                : null;

            // Get server banner URL
            const guildMember = message.guild?.members.cache.get(targetUser.id);
            const serverBanner = guildMember?.avatar 
                ? `https://cdn.discordapp.com/guilds/${message.guild.id}/users/${targetUser.id}/avatars/${guildMember.avatar}${
                    guildMember.avatar.startsWith('a_') ? '.gif' : '.png'
                }?size=4096`
                : null;

            // Get default avatar as fallback
            const defaultAvatar = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });

            // Prepare the initial embed
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setAuthor({ name: `${targetUser.tag}'s Banners`, iconURL: targetUser.displayAvatarURL() })
                .setFooter({ text: `Requested by: ${message.author.tag}` });

            // Set initial image based on what's available
            if (userBanner) {
                embed.setImage(userBanner);
                embed.setDescription('**User Banner**');
            } else if (serverBanner) {
                embed.setImage(serverBanner);
                embed.setDescription('**Server Banner**');
            } else {
                embed.setImage(defaultAvatar);
                embed.setDescription('**No Custom Banner Found**\nShowing default avatar instead');
            }

            // Create buttons for banner toggling
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('user_banner')
                    .setLabel('User Banner')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!userBanner),
                new ButtonBuilder()
                    .setCustomId('server_banner')
                    .setLabel('Server Banner')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!serverBanner),
                new ButtonBuilder()
                    .setCustomId('default_avatar')
                    .setLabel('Default Avatar')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await message.channel.send({ embeds: [embed], components: [buttons] });

            // Button interaction collector
            const collector = msg.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 60000,
                filter: i => i.user.id === message.author.id
            });

            collector.on('collect', async (interaction) => {
                switch (interaction.customId) {
                    case 'user_banner':
                        embed.setImage(userBanner);
                        embed.setDescription('**User Banner**');
                        break;
                    case 'server_banner':
                        embed.setImage(serverBanner);
                        embed.setDescription('**Server Banner**');
                        break;
                    case 'default_avatar':
                        embed.setImage(defaultAvatar);
                        embed.setDescription('**Default Avatar**');
                        break;
                }

                await interaction.update({ embeds: [embed] });
            });

            collector.on('end', () => {
                // Disable all buttons when collector ends
                const disabledButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('user_banner')
                        .setLabel('User Banner')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('server_banner')
                        .setLabel('Server Banner')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('default_avatar')
                        .setLabel('Default Avatar')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
                msg.edit({ components: [disabledButtons] }).catch(() => {});
            });

        } catch (error) {
            console.error('Error in banner command:', error);
            return message.reply({ 
                content: 'An error occurred while fetching banner information.' 
            });
        }
    }
};