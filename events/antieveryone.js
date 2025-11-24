const { Events, PermissionsBitField } = require('discord.js');
const webhookCache = new Map();
const antinukeCache = new Map();

module.exports = async (client) => {
    const fetchFromCacheOrDB = async (key, dbKey) => {
        let cachedData = antinukeCache.get(key);
        if (!cachedData) {
            const data = await client.db.get(dbKey);
            if (data) {
                antinukeCache.set(key, data);
                setTimeout(() => antinukeCache.delete(key), 60000); // Cache data for 1 minute
            }
            return data;
        }
        return cachedData;
    };

    client.on(Events.MessageCreate, async (message) => {
        if (!message.mentions.everyone) return;
        try {
            // Fetch antinuke data from cache or DB
            const antinuke = await fetchFromCacheOrDB(`antinuke_${message.guild.id}`, `${message.guild.id}_antinuke`);
            const whitelistData = await client.db?.get(`${message.guild.id}_${message.author.id}_wl`);
            if (!antinuke || !antinuke.antieveryone || (whitelistData && whitelistData.meneve)) return;

            if (message.author.id === message.guild.ownerId || message.author.id === client.user.id) return;

            if (message.webhookId) {
                const everyoneOverwrite = message.channel.permissionOverwrites.resolve(message.guild.id);
                if (!everyoneOverwrite || everyoneOverwrite?.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                    await client.util.sleep(1000);
                    await message.channel.permissionOverwrites.edit(message.guild.id, {
                        ViewChannel: false
                    }, {
                        reason: `Anti Everyone | Mentioned By ${message.author.tag} (${message.author.id})`
                    }).catch(() => { });
                }
                let webhook = webhookCache.get(message.webhookId);
                if (!webhook) {
                    message.guild.fetchWebhooks()
                        .then(async webhooks => {
                            webhook = webhooks.get(message.webhookId);
                            if (!webhook) return message.delete();

                            webhookCache.set(message.webhookId, webhook);
                            setTimeout(() => webhookCache.delete(message.webhookId), 5000);

                            await client.util.sleep(1000);
                            await webhook.delete('Deleted for mentioning @everyone/here').catch(() => { });
                        })
                        .catch(() => {});
                } else {
                    await client.util.sleep(1000);
                    webhook.delete('Deleted for mentioning @everyone/here').catch(() => { });
                }
                return await message.delete().catch(() => {});
            }

            const recentMessages = await message.channel.messages.fetch({ limit: 50 });
            const everyoneMessages = recentMessages.filter((msg) => msg.mentions.everyone);

            if (everyoneMessages.size === 1) {
                await everyoneMessages.first().delete().catch(() => {});
            } else if (everyoneMessages.size > 1) {
                setTimeout(async () => {
                    await message.channel.bulkDelete(everyoneMessages).catch(() => {});
                }, 2000);
            }

            const everyoneOverwrite = message.channel.permissionOverwrites.resolve(message.guild.id);
            if (!everyoneOverwrite || everyoneOverwrite?.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                await message.channel.permissionOverwrites.edit(message.guild.id, {
                    ViewChannel: false
                }, {
                    reason: `Anti Everyone | Mentioned By ${message.author.tag} (${message.author.id})`
                }).catch(() => {});
            }

            message.author.guild = message.guild;
            await client.util.FuckYou(message.author, 'Mentioned Everyone/Here | Not Whitelisted');
        } catch (err) {
            if (err.code === 429) {
                await client.util.handleRateLimit();
            } else {
                console.error(err);
            }
        }
    });
};
