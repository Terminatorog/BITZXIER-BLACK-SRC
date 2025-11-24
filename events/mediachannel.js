module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;
        let check = await client.db.get(`blacklistserver_${client?.user?.id}`) || [];
        if (check.includes(message?.guild?.id)) return;
        const mediaConfig = (await client.db.get(`mediachannel_${message.guild.id}`)) || { channel: [], user: [], role: [] };
        if (!mediaConfig || !Array.isArray(mediaConfig.channel) || mediaConfig.channel.length === 0) return;
        if (mediaConfig.channel.includes(message.channel.id) && 
            !message.attachments.size && 
            !message.member.roles.cache.some(r => mediaConfig.role.includes(r.id)) && 
            !mediaConfig.user.includes(message.author.id)) {
            await message.delete().catch(() => {});
            const errorMessage = client.util.embed()
                .setColor(client.color)
                .setDescription(
                    `This channel is configured as a media-only channel. You are not allowed to send messages here without attachments.`
                );

            await message.channel.send({ embeds: [errorMessage] }).then((x) => {
                setTimeout(() => x.delete(), 5000);
            });

            return;
        }
    });
};
