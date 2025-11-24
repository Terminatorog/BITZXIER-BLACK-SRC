const { EmbedBuilder, PermissionsBitField } = require('discord.js');
this.config = require(`${process.cwd()}/config.json`)
const wait = require('wait');

module.exports = {
    name: 'antinuke',
    aliases: ['antiwizz', 'an'],
    category: 'security',
    subcommand: [
        'enable', 'disable', 'antiban', 'antiunban', 'antikick', 'antibotadd', 'antichannelcreate', 
        'antichanneldelete', 'antichannelupdate', 'antiemojicreate', 'antiemojidelete', 'antiemojiupdate', 
        'antieveryone', 'antirolecreate', 'antiroledelete', 'antiroleupdate', 'antimemberupdate', 
        'antintegration', 'antisrverupdate', 'antiautomodrulecreate', 'antiautomodruleupdate', 
        'antiautomodruledelete', 'antiguildeventcreate', 'antiguildeventupdate', 'antiguildeventdelete', 
        'antiwebhookcreate', 'antiwebhookdelete', 'antiwebhookupdate', 'antistickercreate', 
        'antistickerdelete', 'antistickerupdate', 'antiprune'
    ], premium: true,
    run: async (client, message, args) => {
        const { enable, disable, protect, hii, tick } = client.emoji;

        let own = message.author.id === message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);
        if (!own && !check) {
            return message.channel.send({
                embeds: [
                    client.util.embed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | Only Server Owner Or Extraowner Can Run This Command.!`
                        )
                ]
            });
        }

        if (
            !own &&
            !(
                message.guild.members.cache.get(client.user.id).roles.highest
                    .position <= message.member.roles.highest.position
            )
        ) {
            const higherole = client.util.embed()
                .setColor(client.color)
                .setDescription(
                    `${client.emoji.cross} | Only Server Owner Or Extraowner Having Higher Role Than Me Can Run This Command`
                );
            return message.channel.send({ embeds: [higherole] });
        }

        let prefix = client.config.PREFIX || message.guild.prefix;
        const option = args[0];

        const defaultAntinukeFeatures = {
            antinuke: false,
            antiban: false,
            antiunban: false,
            antikick: false,
            antibotadd: false,
            antichannelcreate: false,
            antichanneldelete: false,
            antichannelupdate: false,
            antiemojicreate: false,
            antiemojidelete: false,
            antiemojiupdate: false,
            antieveryone: false,
            antirolecreate: false,
            antiroledelete: false,
            antiroleupdate: false,
            antimemberupdate: false,
            antintegration: false,
            antisrverupdate: false,
            antiautomodrulecreate: false,
            antiautomodruleupdate: false,
            antiautomodruledelete: false,
            antiguildeventcreate: false,
            antiguildeventupdate: false,
            antiguildeventdelete: false,
            antiwebhookcreate: false,
            antiwebhookdelete: false,
            antiwebhookupdate: false,
            antistickercreate: false,
            antistickerdelete: false,
            antistickerupdate: false,
            antiprune: false,
        };

        const antinukeData = (await client.db.get(`${message.guild.id}_antinuke`)) || defaultAntinukeFeatures;

        switch (option) {
            case undefined:
                const antinuke = client.util.embed()
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTitle(`__**Antinuke**__`)
            .setDescription(
                `Level up your server security with Antinuke! It swiftly bans admins engaging in suspicious activities, all while safeguarding your whitelisted members. Enhance protection – enable Antinuke now!`
            )
            .addFields([
                {
                    name: `__**Antinuke Enable**__`,
                    value: `To Enable Antinuke, Use - \`${prefix}antinuke enable\``
                },
                {
                    name: `__**Antinuke Disable**__`,
                    value: `To Disable Antinuke, Use - \`${prefix}antinuke disable\``
                },
                {
                    name: `__**Antinuke Channel**__`,
                    value: `\`${prefix}antinuke antichannelcreate\`\n\`${prefix}antinuke antichanneldelete\`\n\`${prefix}antinuke antichannelupdate\``
                },
                {
                    name: `__**Antinuke Role**__`,
                    value: `\`${prefix}antinuke antirolecreate\`\n\`${prefix}antinuke antiroledelete\`\n\`${prefix}antinuke antiroleupdate\``
                },
                {
                    name: `__**Antinuke Member**__`,
                    value: `\`${prefix}antinuke antiban\`\n\`${prefix}antinuke antiunban\`\n\`${prefix}antinuke antikick\`\n\`${prefix}antinuke antimemberupdate\``
                },
                {
                    name: `__**Antinuke Emoji/Sticker**__`,
                    value: `\`${prefix}antinuke antiemojicreate\`\n\`${prefix}antinuke antiemojidelete\`\n\`${prefix}antinuke antiemojiupdate\`\n\`${prefix}antinuke antistickercreate\`\n\`${prefix}antinuke antistickerdelete\`\n\`${prefix}antinuke antistickerupdate\``
                },
                {
                    name: `__**Antinuke Webhook/Integration**__`,
                    value: `\`${prefix}antinuke antiwebhookcreate\`\n\`${prefix}antinuke antiwebhookdelete\`\n\`${prefix}antinuke antiwebhookupdate\`\n\`${prefix}antinuke antintegration\``
                },
                {
                    name: `__**Antinuke Server**__`,
                    value: `\`${prefix}antinuke antisrverupdate\`\n\`${prefix}antinuke antiprune\`\n\`${prefix}antinuke antiautomodrulecreate\`\n\`${prefix}antinuke antiautomodruleupdate\`\n\`${prefix}antinuke antiautomodruledelete\`\n\`${prefix}antinuke antiguildeventcreate\`\n\`${prefix}antinuke antiguildeventupdate\`\n\`${prefix}antinuke antiguildeventdelete\``
                },
                {
                    name: `__**Antinuke Everyone**__`,
                    value: `\`${prefix}antinuke antieveryone\``
                }
            ]);
            message.channel.send({ embeds: [antinuke] });
            break;    
            case 'enable':
                if (antinukeData.antinuke) {
                    return message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setThumbnail(client.user.displayAvatarURL())
                                .setColor(client.color)
                                .setDescription(
                                    `**Security Settings For ${message.guild.name} ${protect}\nUmm, looks like your server has already enabled security\n\nCurrent Status : ${enable}\nTo Disable use ${prefix}antinuke disable**`
                                )
                        ]
                    });
                } else {
                    Object.keys(antinukeData).forEach(key => antinukeData[key] = true);
                    await client.db.set(`${message.guild.id}_antinuke`, antinukeData);

                    const enabled = client.util.embed()
                        .setThumbnail(client.user.displayAvatarURL())
                        .setAuthor({
                            name: `${client.user.username} Security`,
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setColor(client.color)
                        .setDescription(
                            `**Security Settings For ${message.guild.name} ${protect}**\n\nTip: To optimize the functionality of my Anti-Nuke Module, please move my role to the top of the roles list.${hii}\n\n***__Modules Enabled__*** ${protect}\n**Anti Ban: ${enable}\nAnti Unban: ${enable}\nAnti Kick: ${enable}\nAnti Bot: ${enable}\nAnti Channel Create: ${enable}\nAnti Channel Delete: ${enable}\nAnti Channel Update: ${enable}\nAnti Emoji/Sticker Create: ${enable}\nAnti Emoji/Sticker Delete: ${enable}\nAnti Emoji/Sticker Update: ${enable}\nAnti Everyone/Here Ping: ${enable}\nAnti Link Role: ${enable}\nAnti Role Create: ${enable}\nAnti Role Delete: ${enable}\nAnti Role Update: ${enable}\nAnti Role Ping: ${enable}\nAnti Member Update: ${enable}\nAnti Integration: ${enable}\nAnti Server Update: ${enable}\nAnti Automod Rule Create: ${enable}\nAnti Automod Rule Update: ${enable}\nAnti Automod Rule Delete: ${enable}\nAnti Guild Event Create: ${enable}\nAnti Guild Event Update: ${enable}\nAnti Guild Event Delete: ${enable}\nAnti Webhook: ${enable}**\n\n**__Anti Prune__: ${enable}\n__Auto Recovery__: ${enable}**`
                        )
                        .setFooter({
                            text: `Punishment Type: Ban`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        });

                    let msg = await message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setColor(client.color)
                                .setDescription(`${client.emoji.tick} | Initializing Quick Setup!`)
                        ]
                    });

                    const steps = [
                        'Verifying the necessary permissions...',
                        `Checking ${client.user.username}'s role position for optimal configuration...`,
                        `Crafting and configuring the ${client.user.username} Impenetrable Power role...`,
                        `Ensuring precise placement of the ${client.user.username} Impenetrable Power role...`,
                        'Safeguarding your changes...',
                        'Activating the Antinuke Modules for enhanced security...!!'
                    ];

                    for (const step of steps) {
                        await client.util.sleep(1000);
                        await msg.edit({
                            embeds: [
                                client.util.embed()
                                    .setColor(client.color)
                                    .setDescription(`${msg.embeds[0].description}\n${tick} | ${step}`)
                            ]
                        });
                    }

                    await client.util.sleep(2000);
                    await msg.edit({ embeds: [enabled] });

                    if (message.guild.roles.cache.size > 249) {
                        return message.reply(`I Won't Be Able To Create \`${client.user.username} Impenetrable Power\` Because There Are Already 249 Roles In This Server`);
                    }

                    let role = message.guild.members.cache.get(client.user.id).roles.highest.position;
                    let createdRole = await message.guild.roles.create({
                        name: `${client.user.username} Safety Lock`,
                        position: role ? role : 0,
                        reason: `${client.user.username} Role For Unbypassable Setup`,
                        permissions: [PermissionsBitField.Flags.Administrator],
                        color: this.config.excelsafetyrolecolor, // ← config se color use ho raha hai,
                    });
                    await message.guild.members.me.roles.add(createdRole.id);
                }
                break;
                case 'status':
                let statusDescription = `Here is the current status of the Antinuke features in **${message.guild.name}**:\n\n`;

                for (const [key, value] of Object.entries(antinukeData)) {
                    statusDescription += `**${key.replace(/anti/g, 'Antinuke ').replace(/([A-Z])/g, ' $1').trim()}**: ${value ? `${enable} Enabled` : `${disable} Disabled`}\n`;
                }

                const statusEmbed = client.util.embed()
                    .setThumbnail(client.user.avatarURL({ dynamic: true }))
                    .setColor(client.color)
                    .setTitle(`__**Antinuke Status**__`)
                    .setDescription(statusDescription);

                 message.channel.send({ embeds: [statusEmbed] });
                break;

            case 'disable':
                if (!antinukeData.antinuke) {
                    return message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setThumbnail(client.user.displayAvatarURL())
                                .setColor(client.color)
                                .setDescription(
                                    `**Security Settings For ${message.guild.name} ${protect}\nUmm, looks like your server hasn't enabled security.\n\nCurrent Status: ${disable}\n\nTo Enable use ${prefix}antinuke enable**`
                                )
                        ]
                    });
                } else {
                    Object.keys(antinukeData).forEach(key => antinukeData[key] = false);
                    await client.db.set(`${message.guild.id}_antinuke`, antinukeData);
                    await message.channel.send({ embeds: [
                        client.util.embed()
                        .setThumbnail(client.user.displayAvatarURL())
                        .setColor(client.color)
                        .setDescription(
                            `**Security Settings For ${message.guild.name} ${protect}\nSuccessfully disabled security settings for this server.\n\nCurrent Status: ${disable}\n\nTo Enable use ${prefix}antinuke enable**`
                        )
                     ]})
                    await client.db.get(`${message.guild.id}_wl`).then(async (data) => {
                        const users = data.whitelisted;
                        for (let i = 0; i < users.length; i++) {
                            let data2 = await client.db.get(`${message.guild.id}_${users[i]}_wl`);
                            if (data2) {
                                await client.db.delete(`${message.guild.id}_${users[i]}_wl`);
                            }
                        }
                    });
                    await client.db.set(`panic_${message.guild.id}`, null)
                    await client.db.set(`${message.guild.id}_wl`, { whitelisted: [] })

                }
                break;

            default:
                const featureOptions = [
                    'antiban',
                    'antiunban',
                    'antikick',
                    'antibotadd',
                    'antichannelcreate',
                    'antichanneldelete',
                    'antichannelupdate',
                    'antiemojicreate',
                    'antiemojidelete',
                    'antiemojiupdate',
                    'antieveryone',
                    'antirolecreate',
                    'antiroledelete',
                    'antiroleupdate',
                    'antimemberupdate',
                    'antintegration',
                    'antisrverupdate',
                    'antiautomodrulecreate',
                    'antiautomodruleupdate',
                    'antiautomodruledelete',
                    'antiguildeventcreate',
                    'antiguildeventupdate',
                    'antiguildeventdelete',
                    'antiwebhookcreate',
                    'antiwebhookdelete',
                    'antiwebhookupdate',
                    'antistickercreate',
                    'antistickerdelete',
                    'antistickerupdate',
                    'antiprune',
                ];
                if (!antinukeData.antinuke) {
                    return message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setThumbnail(client.user.displayAvatarURL())
                                .setColor(client.color)
                                .setDescription(
                                    `**Security Settings For ${message.guild.name} ${protect}\nUmm, looks like your server hasn't enabled security.\n\nCurrent Status: ${disable}\n\nTo Enable use ${prefix}antinuke enable**`
                                )
                        ]
                    });
                }
                if (featureOptions.includes(option)) {
                    antinukeData[option] = !antinukeData[option];
                    await client.db.set(`${message.guild.id}_antinuke`, antinukeData);

                    const status = antinukeData[option] ? enable : disable;
                    const feature = option.replace(/anti/g, 'antinuke anti');
                    message.channel.send({
                        embeds: [
                            client.util.embed()
                                .setThumbnail(client.user.displayAvatarURL())
                                .setColor(client.color)
                                .setDescription(
`**Security Settings for ${message.guild.name} ${protect}\n\nThe ${feature} feature has been successfully ${status === enable ? 'enabled' : 'disabled'}.\n\n**Current Status:** ${status === enable ? `${enable}` : `${disable}`}**\n\nTo ${status === enable ? 'disable' : 'enable'} this feature, use \`${prefix}${feature}\`.`
                                )
                        ]
                    });
                } else {
                    return message.channel.send({
                        embeds: [antinuke]
                    });
                }
        }
    }
};
