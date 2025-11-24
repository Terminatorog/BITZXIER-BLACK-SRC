   const { Client,
    MessageEmbed,
    ActionRowBuilder,
    ButtonBuilder
} = require('discord.js')
const saixd = ['870040788539678791']
module.exports = {
    name: 'globalban',
    aliases: [],
    category: 'owner',
    run: async (client, message, args) => {
    if (!saixd.includes(message.author.id)) return
let userId = await getUserFromMention(message, args[0]);
if (!userId) {
    try {
      userId = await client.users.fetch(args[0]);
    } catch (error) {
        return message.channel.send({
            embeds: [
                client.util.embed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} | Please Provide Valid user ID or Mention Member.`)
            ]
        });
    }
}

const mutualGuilds = client.guilds.cache.filter(guild => guild.members.cache.has(userId));
for (const guild of mutualGuilds) {
    try {
        await client.util.sleep(2000)
        await guild[1].members.ban(userId, {reason : "User has been globally banned due to repeated and severe violations of Discord's terms of service, including but not limited to harassment, nuking, spamming, distributing malicious content, and engaging in activities that undermine the safety and well-being of the Discord community. This global ban is a result of a pattern of behavior that is deemed unacceptable, and it is necessary to ensure the integrity and security of multiple servers on the platform." });
        await message.channel.send(`Banned From ${guild[1].name}`);
    } catch (err) {
        await message.channel.send(`Can't Banned From ${guild[1].name}`, err);
        if (err.code === 429) {
            await client.util.handleRateLimit();
            return;
        }
    }
}

       }                    
   }

function getUserFromMention(message, mention) {
    if (!mention) return null

    const matches = mention.match(/^<@!?(\d+)>$/)
    if (!matches) return null

    const id = matches[1]
    return id; 
}
