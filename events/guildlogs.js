const { EmbedBuilder, WebhookClient } = require('discord.js')
const { values } = require('lodash')



module.exports = async (client) => {
    const join = new WebhookClient({ url : `https://discord.com/api/webhooks/1376331219914199040/QbaXQQ0C-BvU3Sr_nBD5booWJ1egQ-zErUzGhYixIlB63lFLn4Gfq9zHjyccaWIxKD9l` })
    const leave = new WebhookClient({ url : `https://discord.com/api/webhooks/1376331415410704506/5QZ7XKp4Jo46yG_sHvwqcO613uNFQu0Obgp-Hk2fQaBteX7taG5HYCjE6NGsJzHNqcBa` })
    client.on('guildCreate', async (guild) => {
        const ser = await client.cluster

    .broadcastEval(`this.guilds.cache.size`)

    .then(results => results.reduce((prev, val) => prev + val, 0));


       

    const results = await client.cluster.broadcastEval(client => {

      return client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    });

    const use = results.reduce((acc, count) => acc + count, 0);

  



      /*  const use = client.guilds.cache
            .filter((guild) => guild.available)
            .reduce((prev, guild) => prev + guild.memberCount, 0)
*/
      //  const channel = client.channels.cache.get(join) ? client.channels.cache.get(join) : await client.channels.fetch(join).catch((err) => { })
        var emoji = ''
        let own = await guild.fetchOwner()
        let links = guild.bannerURL({ dynamic: true, size: 1024 })
        if (guild.partnered && guild.verified)
            emoji = `<:Partner:1377340572632879235><:Verified:1377340604341817354>`
        else if (guild.partnered && !guild.verified)
            emoji = '<:Partner:1377340572632879235>'
        else if (!guild.partnered && guild.verified)
            emoji = '<:Verified:1377340604341817354>'
        else if (!guild.partnered && !guild.verified)
            emoji = `${client.emoji.cross}`
        const embed = client.util.embed()
            .setDescription(
                `Id: **${guild.id}**\nName: **${
                    guild.name
                }**\nDiscord Level: ${emoji}\nMemberCount: \`${
                    guild.memberCount + 1
                }\`\nCreated At: <t:${Math.round(
                    guild.createdTimestamp / 1000
                )}> (<t:${Math.round(
                    guild.createdTimestamp / 1000
                )}:R>)\nJoined At: <t:${Math.round(
                    guild.joinedTimestamp / 1000
                )}> (<t:${Math.round(guild.joinedTimestamp / 1000)}:R>)`
            )
            .addFields({ name : 
                `**Owner**`,
               value :  `Info: **${
                    guild.members.cache.get(own.id)
                        ? guild.members.cache.get(own.id).user.tag
                        : 'Unknown user'
                } (${own.id})**\nMentions: <@${
                    own.id
                }>\nCreated At: <t:${Math.round(
                    own.user.createdTimestamp / 1000
                )}> (<t:${Math.round(own.user.createdTimestamp / 1000)}:R>)`
    })
            .addFields({ name : 
                `**${client.user.username}'s Total Servers**`,
              value  : `\`\`\`js\n${ser}\`\`\``},
                true)
            .addFields({ name : 
                `**${client.user.username}'s Total Users**`,
              value :  `\`\`\`js\n${use}\`\`\``},
                true
            )
            .addFields({name : `**Shard Id**`, value :  `\`\`\`js\n${guild.shardId}\`\`\``}, true)
            .setTitle(guild.name)
            .setThumbnail(
                guild.iconURL({
                    dynamic: true,
                    size: 1024
                })
            )
            .setColor(client.color)
        if (guild.vanityURLCode) {
            let temp = `https://discord.gg/` + guild.vanityURLCode
            embed.setURL(temp)
        }
        if (guild.banner) embed.setImage(links)
        await join.send({ embeds: [embed] })
    })

    client.on('guildDelete', async (guild) => {
        const ser = client.guilds.cache.size

        const use = client.guilds.cache
            .filter((guild) => guild.available)
            .reduce((prev, guild) => prev + guild.memberCount, 0)

   const channel = client.channels.cache.get('1376331156617695333') ? client.channels.cache.get('1376331156617695333') : await client.channels.fetch('1376331156617695333').catch((err) => { })
        let links = guild.bannerURL({ dynamic: true, size: 1024 })
        const embed = client.util.embed()
            .setDescription(
                `Id: **${guild.id}**\nName: **${guild.name}**\nMemberCount: \`${
                    guild.memberCount + 1
                }\`\nCreated At: <t:${Math.round(
                    guild.createdTimestamp / 1000
                )}> (<t:${Math.round(
                    guild.createdTimestamp / 1000
                )}:R>)\nJoined At: <t:${Math.round(
                    guild.joinedTimestamp / 1000
                )}> (<t:${Math.round(guild.joinedTimestamp / 1000)}:R>)`
            )
            .addFields({ name : 
                `**${client.user.username}'s Total Servers**`,
               value : `\`\`\`js\n${ser}\`\`\``},
                true
            )
            .addFields({ name : 
                `**${client.user.username}'s Total Users**`,
                value : `\`\`\`js\n${use}\`\`\``},
                true
            )
        if (guild.available) embed.setTitle(guild.name)
        embed.setThumbnail(
            guild.iconURL({
                dynamic: true,
                size: 1024
            })
        )
        embed.setColor(client.color)
        if (guild.vanityURLCode) {
            let temp = `https://discord.gg/` + guild.vanityURLCode
            embed.setURL(temp)
        }
        if (guild.banner) embed.setImage(links)

        await channel.send({ embeds: [embed] })
    })
}
