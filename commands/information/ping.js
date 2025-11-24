const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    category: 'info',
    premium: false,
    cooldown: 4,
    run: async (client, message, args) => {
        const realPing = client.ws.ping;
        const dbPing = await client.db.ping();

        // Generate fake ping if real ping is high
        const generateFakePing = () => Math.floor(Math.random() * 4) + 17; // Random number between 17 and 20
        const displayPing = realPing > 50 ? generateFakePing() : realPing;

        // Determine latency text based on displayed ping
        const getLatencyText = (latency) => {
            if (latency <= 20) return 'Very Fast!';
            if (latency <= 50) return 'Fast!';
            if (latency <= 100) return 'Moderate!';
            if (latency <= 150) return 'Slow!';
            if (latency <= 300) return 'Very Slow!';
            return 'Unstable!';
        };

        const text = getLatencyText(displayPing);

        // Construct and send the embed
        const embed = client.util.embed()
            .setAuthor({
                name: `${displayPing}ms Pong!\n${dbPing?.toFixed(2)}ms Database Ping!`,
                iconURL: message.member.user.displayAvatarURL({ dynamic: true }),
            })
            .setColor(client.color)
            .setFooter({
                text: `Response Speed: ${text}`,
                iconURL: client.user.displayAvatarURL(),
            });

        return message.channel.send({ embeds: [embed] });
    },
};

