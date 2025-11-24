const { ActivityType } = require('discord.js')
module.exports = async (client) => {
    client.on('ready', async () => {
       client.user.setPresence({
        activities: [
            {
                name: 'Team Excel..!!',
                type: ActivityType.Listening // Can be Playing, Streaming, Listening, Watching
            }
        ],
        status: 'online' // Can be 'online', 'idle', 'dnd', 'invisible'
    });
        client.logger.log(`Logged in to ${client.user.tag}`, 'ready')
//client.util.checkAndLeaveNonPremiumGuilds(client)
    })
    

}
