const { EmbedBuilder } = require('discord.js')
const axios = require('axios')
const emojis = require('../../emoji.js');
module.exports = {
    name: 'userinfo',
    aliases: ['ui'],
    category: 'info',
    premium: false,
    run: async (client, message, args) => {
        let user;
        if (args[0]) {
            let Id = getId(args[0]);
            if (Id)
                user = await client.users.fetch(Id).catch(err => { });
            if (!user)
                return message.channel.send({
                    embeds: [
                        client.util.embed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | Please Provide Valid user ID or Mention Member.`
                            )
                    ]
                })
        } else {
            user = message.author;
        } 
        let me = await message.guild.members.fetch(user.id).catch(err => { });
        if (me) {
            let flags = '';
            const userFlags = me.user.flags?.bitfield || 0;
            const badgeEmojis = emojis.badges;

            if (userFlags & (1 << 0)) flags += badgeEmojis.employee; // DISCORD_EMPLOYEE
            if (userFlags & (1 << 1)) flags += badgeEmojis.partner; // PARTNERED_SERVER_OWNER
            if (userFlags & (1 << 2)) flags += badgeEmojis.bug1; // BUGHUNTER_LEVEL_1
            if (userFlags & (1 << 3)) flags += badgeEmojis.hypesquad; // HYPESQUAD_EVENTS
            if (userFlags & (1 << 6)) flags += badgeEmojis.bravery; // HOUSE_BRAVERY
            if (userFlags & (1 << 7)) flags += badgeEmojis.brilliance; // HOUSE_BRILLIANCE
            if (userFlags & (1 << 8)) flags += badgeEmojis.balance; // HOUSE_BALANCE
            if (userFlags & (1 << 9)) flags += badgeEmojis.supporter; // EARLY_SUPPORTER
            if (userFlags & (1 << 12)) flags += badgeEmojis.team; // TEAM_USER
            if (userFlags & (1 << 14)) flags += badgeEmojis.system; // SYSTEM
            if (userFlags & (1 << 16)) flags += badgeEmojis.verifiedBot; // VERIFIED_BOT
            if (userFlags & (1 << 17)) flags += badgeEmojis.bug2; // BUGHUNTER_LEVEL_2
            if (userFlags & (1 << 18)) flags += badgeEmojis.verifiedBot; // VERIFIED_BOT
            if (userFlags & (1 << 19)) flags += badgeEmojis.dev; // EARLY_VERIFIED_DEVELOPER
            if (userFlags & (1 << 22)) flags += badgeEmojis.activeDev; // ACTIVE_DEVELOPER

            if (flags === '') flags = `${emojis.cross} No User Badges`;
            let keys = '';
            let f = me.permissions.toArray();
            
           if(me.user.id === message.guild.ownerId) {
               keys = 'Server Owner';
           } else if(me.user.id === '1051442182466314281') {
       keys = 'Excel Premium | Daddy';        
           } else if(client.config.owner.includes(me.user.id)) {
             keys = 'Excel Developer';  
           } else if (f.includes('Administrator')) {
                keys = 'Server Administrator';
            } else if (f.includes('MODERATE_MEMBERS') && f.includes('KICK_MEMBERS') && f.includes('BanMembers')) {
                keys = 'Server Moderator';
            } else if (me.user.id === message.guild.ownerId) {
                keys = 'Server Owner';
            } else {
                keys = 'Server Member';
            }
            const data = await axios
                .get(`https://discord.com/api/users/${me.user.id}`, {
                    headers: {
                        Authorization: `Bot ${client.token}`
                    }
                })
                .then((d) => d.data);

            let bannerURL = null; // Initialize bannerURL variable

            if (data.banner) {
                let url = data.banner.startsWith('a_') ? '.gif?size=4096' : '.png?size=4096';
                bannerURL = `https://cdn.discordapp.com/banners/${me.user.id}/${data.banner}${url}`;
            }

            let permArray = me.permissions.toArray().sort((a, b) => a.localeCompare(b)).map(x => translatePermission(x));
            let emb = client.util.embed().setColor(client.color).setAuthor({ name: `${me.user.tag}'s Information`, iconURL: me.user.displayAvatarURL({ dynamic: true }) }).setThumbnail(me.user.displayAvatarURL({ dynamic: true })).addFields([
                {
                    name: `__General Information__`,
                    value: `**UserName** : ${me.user.username} \n **User Id** : ${me.user.id} \n **Nickname** : ${me.nickname ? me.nickname : 'None'} \n **Bot?** : ${me.user.bot ? `${client.emoji.tick}` : `${client.emoji.cross}`} \n **Discord Badges** : ${flags} \n **Account Created** : <t:${Math.round(me.user.createdTimestamp / 1000)}:R> \n **Server Joined** : <t:${Math.round(me.joinedTimestamp / 1000)}:R>`
                },
                {
                    name: `__Roles Info__`,
                    value: `**Highest Role** : ${me.roles.highest} \n **Color** : ${me.displayHexColor} \n **Roles [${me.roles.cache.size}]** : ${me.roles.cache.size < 30 ? [...me.roles.cache.values()].sort((a, b) => b.rawPosition - a.rawPosition).map(r => `<@&${r.id}>`).join(', ') : me.roles.cache.size > 30 ? trimArray(me.roles.cache) : 'NO ROLES'}`
                },
                {
                    name: `__Key Permissions__`,
                    value: `${permArray.length ? permArray.join(', ') : "No Permissions"}`
                },
                {
                    name: `__Acknowledgement__`,
                    value: `${keys}`
                }
            ])
                .setFooter({ text: `Requested By : ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            if (bannerURL)
                emb.setImage(bannerURL)
            return message.channel.send({ embeds: [emb] });
        }
        else {
            const data = await axios
                .get(`https://discord.com/api/users/${user.id}`, {
                    headers: {
                        Authorization: `Bot ${client.token}`
                    }
                })
                .then((d) => d.data);

            let bannerURL = null; // Initialize bannerURL variable

            if (data.banner) {
                let url = data.banner.startsWith('a_') ? '.gif?size=4096' : '.png?size=4096';
                bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${data.banner}${url}`;
            }
            let flags = '';
            const userFlags = user.flags?.bitfield || 0;
            const badgeEmojis = emojis.badges;

            if (userFlags & (1 << 0)) flags += badgeEmojis.employee;
            if (userFlags & (1 << 1)) flags += badgeEmojis.partner;
            if (userFlags & (1 << 2)) flags += badgeEmojis.bug1;
            if (userFlags & (1 << 3)) flags += badgeEmojis.hypesquad;
            if (userFlags & (1 << 6)) flags += badgeEmojis.bravery;
            if (userFlags & (1 << 7)) flags += badgeEmojis.brilliance;
            if (userFlags & (1 << 8)) flags += badgeEmojis.balance;
            if (userFlags & (1 << 9)) flags += badgeEmojis.supporter;
            if (userFlags & (1 << 12)) flags += badgeEmojis.team;
            if (userFlags & (1 << 14)) flags += badgeEmojis.system;
            if (userFlags & (1 << 16)) flags += badgeEmojis.verifiedBot;
            if (userFlags & (1 << 17)) flags += badgeEmojis.bug2;
            if (userFlags & (1 << 18)) flags += badgeEmojis.verifiedBot;
            if (userFlags & (1 << 19)) flags += badgeEmojis.dev;
            if (userFlags & (1 << 22)) flags += badgeEmojis.activeDev;

            if (flags === '') flags = `${emojis.cross} No User Badges`;

            let em = client.util.embed().setColor(client.color).setAuthor({ name: `${user.username}'s Information`, iconURL: user.displayAvatarURL({ dynamic: true }) }).addFields([
                {
                    name: `__General Information__`,
                    value: `**UserName** : ${user.username} \n **User ID** : ${user.id} \n **Bot?** : ${user.bot ? `${client.emoji.tick}` : `${client.emoji.cross}`} \n **Discord Badges** : ${flags} \n **Account Created** : <t:${Math.round(user.createdTimestamp / 1000)}:R>`
                }
            ]).setFooter({ text: `Requested By : ${message.author.tag} | User Is Not In This Guild`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setThumbnail(user.displayAvatarURL({ dynamic: true }))
            if (bannerURL)
                em.setImage(bannerURL)
            return message.channel.send({ embeds: [em] });
        }
    }
}

function trimArray(arr, maxLen = 25) {
    if ([...arr.values()].length > maxLen) {
        const len = [...arr.values()].length - maxLen;
        arr = [...arr.values()].sort((a, b) => b?.rawPosition - a.rawPosition).slice(0, maxLen);
        arr.map(role => `<@&${role.id}>`)
        arr.push(`${len} more...`);
    }
    return arr.join(", ");
}
function translatePermission(permission) {
    switch (permission) {
        case 'CREATE_INSTANT_INVITE':
            return 'Create Instant Invite';
        case 'KICK_MEMBERS':
            return 'Kick Members';
        case 'BanMembers':
            return 'Ban Members';
        case 'Administrator':
            return 'Administrator';
        case 'MANAGE_CHANNELS':
            return 'Manage Channels';
        case 'ManageGuild':
            return 'Manage Server';
        case 'ADD_REACTIONS':
            return 'Add Reactions';
        case 'VIEW_AUDIT_LOG':
            return 'View Audit Log';
        case 'PRIORITY_SPEAKER':
            return 'Priority Speaker';
        case 'STREAM':
            return 'Stream';
        case 'VIEW_CHANNEL':
            return 'View Channel';
        case 'SEND_MESSAGES':
            return 'Send Messages';
        case 'SEND_TTS_MESSAGES':
            return 'Send TTS Messages';
        case 'MANAGE_MESSAGES':
            return 'Manage Messages';
        case 'EMBED_LINKS':
            return 'Embed Links';
        case 'ATTACH_FILES':
            return 'Attach Files';
        case 'READ_MESSAGE_HISTORY':
            return 'Read Message History';
        case 'MENTION_EVERYONE':
            return 'Mention Everyone';
        case 'USE_EXTERNAL_EMOJIS':
            return 'Use External Emojis';
        case 'CONNECT':
            return 'Connect';
        case 'SPEAK':
            return 'Speak';
        case 'MUTE_MEMBERS':
            return 'Mute Members';
        case 'DEAFEN_MEMBERS':
            return 'Deafen Members';
        case 'MOVE_MEMBERS':
            return 'Move Members';
        case 'USE_VAD':
            return 'Use Voice Activity';
        case 'CHANGE_NICKNAME':
            return 'Change Nickname';
        case 'MANAGE_NICKNAMES':
            return 'Manage Nicknames';
        case 'ManageRoles':
            return 'Manage Roles';
        case 'ManageWebhooks':
            return 'Manage Webhooks';
        case 'MANAGE_EMOJIS':
            return 'Manage Emojis';
        default:
            return permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }
}

function getId(args) {
    if (args.startsWith("<@")) {
        let id = args.match(/^<@!?(\d+)>$/);
        if (!id) return null;
        return id[1];
    } else {
        return args;
    }
}