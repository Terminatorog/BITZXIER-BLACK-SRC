const { MessageEmbed, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');
const os = require('os');

module.exports = {
    name: 'stats',
    category: 'info',
    aliases: ['botinfo', 'bi'],
    usage: 'stats',
    premium: false,

    run: async (client, message, args) => {
        // Buttons for various information
        let button = new ButtonBuilder()
            .setLabel('Team Info')
            .setCustomId('team')
            .setStyle(ButtonStyle.Success);

        let button1 = new ButtonBuilder()
            .setLabel('General Info')
            .setCustomId('general')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        let button2 = new ButtonBuilder()
            .setLabel('System Info')
            .setCustomId('system')
            .setStyle(ButtonStyle.Danger);

        let button3 = new ButtonBuilder()
            .setLabel('Partners')
            .setCustomId('partners')
            .setStyle(ButtonStyle.Secondary);

        // New button for the graph
        let buttonGraph = new ButtonBuilder()
            .setLabel('Latency Graph')
            .setCustomId('latencyGraph')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);

        const uptime = Math.round(Date.now() - client.uptime);
        let guilds1 = client.guilds.cache.size;
        let member1 = client.guilds.cache.reduce((x, y) => x + y.memberCount, 0);

        const embed = client.util.embed()
            .setColor(client.color)
            .setTitle(`These statistics are only for cluster ${client.cluster.id} not for the entire bot.`)
            .setURL('https://discord.gg/excelbot')
            .setAuthor({
                name: client.users.cache.get('870040788539678791').globalName,
                iconURL: client.guilds.cache.get('1308777793739554846')?.members?.cache?.get('870040788539678791')?.user?.displayAvatarURL({ dynamic: true })
            })
            .setDescription(
                `**__General Informations__**\nBot's Mention: <@!${client.user.id}>\nBot's Tag: ${client.user.tag}\nCluster: ${client.cluster.id}\nShard: ${message.guild.shardId}\nBot's Version: 4.0.0\nTotal Servers: ${guilds1}\nTotal Users: ${member1} (${client.users.cache.size} Cached)\nTotal Channels: ${client.channels.cache.size}\nLast Rebooted: ${moment(uptime).fromNow()}`
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({
                text: `Requested By ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            });

        let msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user && i.isButton(),
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                return i.reply({
                    content: "> This isn't for you.",
                    ephemeral: true
                });
            }

            if (i.isButton()) {
                if (i.customId == 'latencyGraph') {
                    i.deferUpdate();
                    let db = await client.db.ping()
                    const uri = await client.util.generateLatencyChart(client.ws.ping, db);
                    const graphEmbed = client.util.embed().setColor(client.color).setDescription('This graph represents the latency between the bot and the database, alongside the WebSocket ping. A lower value indicates better performance.').setFooter({
                        text: `Requested by ${message.author.tag} | Latency Overview`,
                        iconURL: message.author.displayAvatarURL({ dynamic: true }),
                    })
                    .setImage(uri); // Use the chart URL as the image for the embed
                    button = button.setDisabled(false);
                    button1 = button1.setDisabled(false);
                    button2 = button2.setDisabled(false);
                    button3 = button3.setDisabled(false);
                    buttonGraph = buttonGraph.setDisabled(true); // Disable the graph button after timeout
                    const row1 = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);

                    if (msg) return msg.edit({ embeds: [graphEmbed], components: [row1] });
                }

                // Handle Partners button
                if (i.customId == 'partners') {
                    i.deferUpdate();

                    const em = client.util.embed()
                        .setColor(client.color)
                        .setAuthor({
                            name: "EXCEL Partner's",
                            iconURL: client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `**If you're interested in partnering with us, please contact the bot owners directly.** [**VISHU**](https://discord.com/users/870040788539678791)\n[**SUPPORT SERVER**](https://discord.com/invite/Excelbot)`
                        )
                        .setFooter({
                            text: `© Powered By Team Excel`,
                            iconURL: 'https://media.discordapp.net/attachments/1374260482835349565/1375034231797055551/Picsart_25-05-21_09-49-36-709.png?'
                        })
                        .setImage('https://media.discordapp.net/attachments/1375036438776647680/1375036472733732964/Picsart_25-05-22_14-33-04-361.jpg?');

                    button = button.setDisabled(false);
                    button1 = button1.setDisabled(false);
                    button2 = button2.setDisabled(false);
                    button3 = button3.setDisabled(true);
                    buttonGraph = buttonGraph.setDisabled(false); // Disable the graph button after timeout
                    const row1 = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);

                    if (msg) return msg.edit({ embeds: [em], components: [row1] });
                }

                // Handle Team button
                if (i.customId == 'team') {
                    i.deferUpdate();

                    let dev = [], cteam = [], supp = [], supe = [];
                    let user = await client.users.fetch('870040788539678791'); //VISHU
                    dev.push(`**[${user.username}](https://discord.com/users/870040788539678791)**`);
                    

                    user = await client.users.fetch('1118020446353371147'); //𝑷𝒓𝒐𝒇𝒆𝒔𝒔𝒐𝒓
                    cteam.push(`**[${user.username}](https://discord.com/users/1118020446353371147)**`);
                    user = await client.users.fetch('790285901132857394'); //subh
                    cteam.push(`**[${user.username}](https://discord.com/users/790285901132857394)**`);
                    user = await client.users.fetch('827219080208580669'); //yateesh
                    cteam.push(`**[${user.username}](https://discord.com/users/827219080208580669)**`);

                    user = await client.users.fetch('1349427418632294554'); //nitya
                    supe.push(`**[${user.username}](https://discord.com/users/1349427418632294554)**`);

                    const em = client.util.embed()
                        .setColor(client.color)
                        .setAuthor({ name: `${client.user.username} 's Information`,iconURL: client.user.displayAvatarURL()})
                        .setThumbnail(message.guild.iconURL({ dynamic: true }))
                        .addFields([
                            { name: `**__Developers__**`, value: dev.join(', ') },
                            { name: `**__Excel Team__**`, value: cteam.join(', ') },
                            { name: `**__Support Team__**`, value: supe.join(', ') }
                        ])
                        .setFooter({
                            text: `Requested By ${message.author.tag}`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        })
                        .setThumbnail(client.user.displayAvatarURL());

                    button = button.setDisabled(true);
                    button1 = button1.setDisabled(false);
                    button2 = button2.setDisabled(false);
                    button3 = button3.setDisabled(false);
                    buttonGraph = buttonGraph.setDisabled(false); // Disable the graph button after timeout
                    const row1 = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);

                    if (msg) return msg.edit({ embeds: [em], components: [row1] });
                }

                // Handle General Info button
                if (i.customId == 'general') {
                    i.deferUpdate();

                    let member1 = client.guilds.cache.reduce((x, y) => x + y.memberCount, 0) || 0;
                    let guilds = client.guilds.cache.size;

                    const embed = client.util.embed()
                        .setColor(client.color)
                        .setTitle(`These statistics are only for cluster ${client.cluster.id} not for the entire bot.`)
                        .setURL('https://discord.gg/excelbot')
                        .setAuthor({
                            name: client.users.cache.get('870040788539678791').globalName,
                            iconURL: client.guilds.cache.get('1308777793739554846')?.members?.cache?.get('870040788539678791')?.user?.displayAvatarURL({ dynamic: true })
                        })
                        .setDescription(
                            `**__General Informations__**\nBot's Mention: <@!${client.user.id}>\nBot's Tag: ${client.user.tag}\nCluster: ${client.cluster.id}\nShard: ${message.guild.shardId}\nBot's Version: 4.0.0\nTotal Servers: ${guilds}\nTotal Users: ${member1} (${client.users.cache.size} Cached)\nTotal Channels: ${client.channels.cache.size}`
                        )
                        .setThumbnail(client.user.displayAvatarURL())
                        .setFooter({
                            text: `Requested By ${message.author.tag}`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        });

                    button = button.setDisabled(false);
                    button1 = button1.setDisabled(true);
                    button2 = button2.setDisabled(false);
                    button3 = button3.setDisabled(false);
                    buttonGraph = buttonGraph.setDisabled(false); // Disable the graph button after timeout
                    const row1 = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);

                    if (msg) return msg.edit({ embeds: [embed], components: [row1] });
                }
                if (i.customId == 'system') {
                    button = button.setDisabled(false);
                    button1 = button1.setDisabled(false);
                    button2 = button2.setDisabled(true);
                    button3 = button3.setDisabled(false);
                    buttonGraph = buttonGraph.setDisabled(false); // Disable the graph button after timeout
                    i.deferUpdate()
                    if (msg)
                        msg.edit({
                            embeds: [
                                client.util.embed()
                                    .setColor(client.color)
                                    .setAuthor({
                                        name: `${client.user.username}Informations`,
                                        iconURL: client.guilds.cache
                                            .get('1308777793739554846')
                                            ?.members?.cache?.get(
                                                '870040788539678791'
                                            )
                                            ?.user?.displayAvatarURL({
                                                dynamic: true
                                            })
                                    })
                                    .setFooter({
                                        text: `Requested By ${message.author.tag}`,
                                        iconURL:
                                            message.author.displayAvatarURL({
                                                dynamic: true
                                            })
                                    })
                                    .setDescription(
                                        '<a:Loading:1376282107294515271>  | **Fetching** all the **resources**...'
                                    )
                            ],
                            components: [row]
                        })
                    const totalMemoryBytes = os.totalmem()
                    const cpuCount = os.cpus().length
                    const freeMemoryBytes = os.freemem()
                    const memoryUsageBytes = totalMemoryBytes - freeMemoryBytes

                    let totalMemoryGB = totalMemoryBytes / (1024 * 1024 * 1024)
                    let memoryUsageGB = memoryUsageBytes / (1024 * 1024 * 1024)

                    if (
                        totalMemoryGB >=
                        totalMemoryBytes / (1024 * 1024 * 1024)
                    )
                        totalMemoryGB = totalMemoryGB.toFixed(2) + ' GB'
                    else
                        totalMemoryGB =
                            (totalMemoryBytes / (1024 * 1024)).toFixed(2) +
                            ' MB'

                    if (
                        memoryUsageGB >=
                        memoryUsageBytes / (1024 * 1024 * 1024)
                    )
                        memoryUsageGB = memoryUsageGB.toFixed(2) + ' GB'
                    else
                        memoryUsageGB =
                            memoryUsageBytes / (1024 * 1024).toFixed(2) + ' MB'

                    const processors = os.cpus()

                    const cpuUsage1 = os.cpus()[0].times
                    const startUsage1 =
                        cpuUsage1.user +
                        cpuUsage1.nice +
                        cpuUsage1.sys +
                        cpuUsage1.irq
                    let cpuUsage2
                    setTimeout(async () => {
                        cpuUsage2 = os.cpus()[0].times
                        const endUsage1 =
                            cpuUsage2?.user +
                            cpuUsage2?.nice +
                            cpuUsage2?.sys +
                            cpuUsage2?.irq

                        const totalUsage = endUsage1 - startUsage1

                        let idleUsage = 0
                        let totalIdle = 0

                        for (let i = 0; i < cpuCount; i++) {
                            const cpuUsage = os.cpus()[i].times
                            totalIdle += cpuUsage.idle
                        }

                        idleUsage =
                            totalIdle - (cpuUsage2.idle - cpuUsage1.idle)
                        const cpuUsagePercentage =
                            (totalUsage / (totalUsage + idleUsage)) * 100
                        const startTime = process.cpuUsage()
                        const endTime = process.cpuUsage()
                        const usedTime =
                            endTime.user -
                            startTime.user +
                            endTime.system -
                            startTime.system
                        const ping = await client?.db?.ping()
                        const embed1 = client.util.embed()
                            .setColor(client.color)
                            .setAuthor({
                                name: `${client.user.username} Informations`,
                                iconURL: client.guilds.cache
                                    .get('1308777793739554846')
                                    ?.members?.cache?.get('870040788539678791')
                                    ?.user?.displayAvatarURL({ dynamic: true })
                            })
                            .setDescription(
                                `**__System Informations__**\nSystem Latency: ${
                                    client.ws.ping
                                }ms\nPlatform: ${
                                    process.platform
                                }\nArchitecture: ${
                                    process.arch
                                }\nMemory Usage: ${memoryUsageGB}/${totalMemoryGB}\nProcessor 1:\n Model: ${
                                    processors[0].model
                                }\n Speed: ${
                                    processors[0].speed
                                } MHz\nTimes:\n User: ${
                                    cpuUsage2.user
                                } ms\n Sys: ${
                                    cpuUsage2.sys
                                } ms\n Idle: ${cpuUsage2.idle} ms\n IRQ: ${
                                    cpuUsage2.irq
                                } ms\nDatabase Latency: ${
                                    ping?.toFixed(2) || '0'
                                }ms`
                            )
                            .setThumbnail(client.user.displayAvatarURL())
                            .setFooter({
                                text: `Requested By ${message.author.tag}`,
                                iconURL: message.author.displayAvatarURL({
                                    dynamic: true
                                })
                            })
                        button = button.setDisabled(false)
                        button1 = button1.setDisabled(false)
                        button2 = button2.setDisabled(true)
                        button3 = button3.setDisabled(false)
                        buttonGraph = buttonGraph.setDisabled(false)
                        const row1 = new ActionRowBuilder().addComponents([
                            button,
                            button1,
                            button2,
                            button3,
                            buttonGraph
                        ])
                        if (msg)
                            return msg.edit(
                                { embeds: [embed1], components: [row1] },
                                message,
                                msg
                            )
                    }, 2000)
                }
            }
        });

        collector.on('end', () => {
            if (msg) {
                button = button.setDisabled(true);
                button1 = button1.setDisabled(true);
                button2 = button2.setDisabled(true);
                button3 = button3.setDisabled(true); // Disable all buttons after timeout
                buttonGraph = buttonGraph.setDisabled(true); // Disable the graph button after timeout
                const row1 = new ActionRowBuilder().addComponents([button, button1, button2, button3, buttonGraph]);
                return msg.edit({ components: [row1] });
            }
        });
    }
};
