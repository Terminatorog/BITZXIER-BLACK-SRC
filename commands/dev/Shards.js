const {
    Message,
    Client,
    MessageEmbed,
    ActionRowBuilder,
    ButtonBuilder
} = require('discord.js');
const config = require(`${process.cwd()}/config.json`);

module.exports = {
    name: 'shards',
    aliases: ['cluster', 'clusters'],
    category: 'owner',
    run: async (client, message, args) => {
        // Check if the user is the bot owner
        if (!config.owner.includes(message.author.id)) return;

        const embed = client.util.embed()
            .setTitle('Excel Status:')
            .setColor(client.color);

        // Collecting shard information
        const shardInfo = await client.cluster.broadcastEval((client) => {
            const cpuUsage = process.cpuUsage();
            const cpuPercent = ((cpuUsage.user + cpuUsage.system) / (process.uptime() * 1e6)) * 100;
            const uptime = Date.now() - process.uptime() * 1000;

            return {
                id: client.cluster.id,
                shardId: client.cluster.ids[0],
                latency: client.ws.ping,
                uptime,
                ram: process.memoryUsage().rss / 1024 / 1024,
                cpu: cpuPercent,
                servers: client.guilds.cache.size,
                members: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            };
        });

        // Adding shard information to the embed
        shardInfo.forEach(shard => {
            embed.addField(`Cluster [${shard.id}]`,
                `**Latency:** ${shard.latency}ms\n` +
                `**Uptime:** <t:${Math.floor(shard.uptime / 1000)}:R>\n` +
                `**RAM:** ${Math.round(shard.ram)} MB\n` +
                `**CPU:** ${shard.cpu.toFixed(2)}%\n` +
                `**Servers:** ${shard.servers}\n` +
                `**Members:** ${shard.members.toLocaleString()}`);
        });

        // Sending the embed to the channel
        return message.channel.send({ embeds: [embed] });
    }
};


