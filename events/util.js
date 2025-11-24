const Autoresponder = require('../models/Autoresponder');
const Sticky = require('../models/sticky')
const cooldowns = new Map();
const { Collection } = require('discord.js');

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.content || message.system) return;
            const cooldownTime = 3000;
        if (cooldowns.has(message.author.id)) {
            const expirationTime = cooldowns.get(message.author.id) + cooldownTime;
            if (Date.now() < expirationTime) {
                return;
            }
        }
        const autoresponder = await Autoresponder.findOne({ guildId: message.guild.id });
        if (!autoresponder || autoresponder.triggers.length === 0) return;
        const trigger = autoresponder.triggers.find(t => message.content.toLowerCase() === t.trigger.toLowerCase());
        if (trigger) {
            message.channel.send(trigger.response);
            cooldowns.set(message.author.id, Date.now());
            setTimeout(() => {
                cooldowns.delete(message.author.id);
            }, cooldownTime);
        }
    });

    
    const stickyTimers = new Map(); // Ensure this is defined at the top level of your bot file

    client.on('messageCreate', async (message) => {
        if (message.system || !message.guild || message.author.id === client.user.id) return;
    
        try {
            const sticky = await Sticky.findOne({ guildId: message.guild.id, channelId: message.channel.id });
            if (!sticky) return; // No sticky message set for this channel
    
            // Clear any existing timer for this channel
            if (stickyTimers.has(message.channel.id)) {
                clearTimeout(stickyTimers.get(message.channel.id));
            }
    
            // Set a new timer to send the sticky message after 2 seconds of inactivity
            const timer = setTimeout(async () => {
                try {
                    // Fetch and delete the old sticky message if it exists
                    const oldStickyMessage = await message.channel.messages.fetch(sticky.messageId).catch(() => null);
                    if (oldStickyMessage) {
                        await oldStickyMessage.delete().catch(err => {
                            console.error(`Failed to delete old sticky message in channel ${message.channel.id}:`, err);
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching or deleting old sticky message in channel ${message.channel.id}:`, err);
                }
    
                try {
                    // Send the new sticky message
                    const stickyMessage = await message.channel.send(sticky.content);
                    sticky.messageId = stickyMessage.id;
                    await sticky.save();
                } catch (err) {
                    console.error(`Error sending new sticky message in channel ${message.channel.id}:`, err);
                }
    
            }, 4000); // 2-second delay
    
            // Store the timer in the collection
            stickyTimers.set(message.channel.id, timer);
    
        } catch (err) {
            console.error(`Error processing sticky message in channel ${message.channel.id}:`, err);
        }
    });
       
   
}