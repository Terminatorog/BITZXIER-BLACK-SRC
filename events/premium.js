const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
this.config = require(`${process.cwd()}/config.json`);

module.exports = async (client) => {
    let userCooldown = new Map(); // To track user cooldowns
    let leaderboardMessageId = '1291389782165033085'; // Replace with your saved message ID

    client.on('ready', async () => {
        // Fetch the leaderboard channel (replace with your channel ID)
        const leaderboardChannel = client.channels.cache.get('1291385147442331740') ? client.channels.cache.get('1291385147442331740') : await client.channels.fetch('1291385147442331740');
        if (!leaderboardChannel) return console.error('Leaderboard channel not found');

        const updateLeaderboard = async () => {
        const keys = await client.db.all(); // Adjust this according to your database library
        const premiumUsers = keys.filter(key => key.ID.startsWith('uprem_') && key.data === 'true');

    if (premiumUsers.length === 0) {
        return 'No premium users found.';
    }

    const currentTime = Date.now(); // Get the current time
    const premiumUserList = await Promise.all(premiumUsers.map(async user => {
        const userId = user.ID.split('_')[1];
        const userEnd = await client.db.get(`upremend_${userId}`);
        const userCount = await client.db.get(`upremcount_${userId}`);
        // Only include users whose premium status has not expired
        if (userEnd > currentTime) { // Check if the expiration time is in the future
            return {
                userId,
                userCount: parseInt(userCount || 0),
                userEnd: parseInt(userEnd || 0)
            };
        }
        return null; // Exclude expired users
    }));

    // Filter out null values (expired users)
    const validPremiumUsers = premiumUserList.filter(user => user !== null);

    if (validPremiumUsers.length === 0) {
        return 'No active premium users found.';
    }

    const sortedUsers = validPremiumUsers.sort((a, b) => b.userCount - a.userCount).slice(0, 10); // Top 10
    const leaderboard = sortedUsers.map(user => 
        `<@${user.userId}> - Premium Count: \`${user.userCount}\` - Expiry: <t:${Math.floor(user.userEnd / 1000)}:R>`
    );

    return `**Top 10 Premium Users**:\n${leaderboard.join('\n')}`;
};
        // Try fetching the existing message if it exists
        let leaderboardMessage;
        try {
            leaderboardMessage = leaderboardChannel.messages.cache.get(leaderboardMessageId) ? leaderboardChannel.messages.cache.get(leaderboardMessageId) : await leaderboardChannel.messages.fetch(leaderboardMessageId);
        } catch (err) {
            console.error(`Error fetching leaderboard message: ${err.message}`);
        }

        // If no message exists, send a new one and save its ID
        if (!leaderboardMessage) {
            const initialLeaderboard = await updateLeaderboard();
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle('Premium User Leaderboard')
                .setDescription(initialLeaderboard)    
				.setFooter({ text: `Premium Leaderboard is live updating every 5 minutes` }); // Add the footer here

            // Create the button
            const button = new ButtonBuilder()
                .setCustomId('check_premium_status')
                .setLabel('Check My Premium Status')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            leaderboardMessage = await leaderboardChannel.send({ embeds: [embed], components: [row] });
            leaderboardMessageId = leaderboardMessage.id; // Save the new message ID for future updates
        }
 setInterval(async () => {
            const updatedLeaderboard = await updateLeaderboard();
            const updatedEmbed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle('Premium User Leaderboard')
                .setDescription(updatedLeaderboard)
				.setFooter({ text: `Premium Leaderboard is live updating every 5 minutes` }); // Add the footer here

            // Create the button again to include it in the updated message
            const button = new ButtonBuilder()
                .setCustomId('check_premium_status')
                .setLabel('Check My Premium Status')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            try {
                await leaderboardMessage.edit({ embeds: [updatedEmbed], components: [row] });
            
			} catch (err) {
                console.error(`Error editing leaderboard message: ${err.message}`);
            }
        }, 300000); // 5 minutes in milliseconds

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton() || interaction.customId !== "check_premium_status") return;
            const userId = interaction.user.id;

            // Check if the user is on cooldown
            const lastInteractionTime = userCooldown.get(userId);
            const currentTime = Date.now();

            if (lastInteractionTime && currentTime - lastInteractionTime < 300000) { // 5 minutes cooldown
                const remainingTime = 300000 - (currentTime - lastInteractionTime);
                const seconds = Math.ceil(remainingTime / 1000);
                return interaction.reply({ content: `You can check your premium status again in ${seconds} seconds.`, ephemeral: true });
            }

            // Update the cooldown
            userCooldown.set(userId, currentTime);

            // Fetch premium status
            const userPremiumData = await client.db.get(`uprem_${userId}`); // Fetch user's premium data from the database
            const isPremium = userPremiumData === 'true';
            const userCount = await client.db.get(`upremcount_${userId}`);
            const userEnd = await client.db.get(`upremend_${userId}`);

            const statusMessage = isPremium
                ? `You have premium status with count: \`${userCount}\` - Expiry: <t:${Math.floor(userEnd / 1000)}:R>`
                : `You do not have premium status.`;

            // Reply with the user's premium status
            await interaction.reply({ content: statusMessage, ephemeral: true });
        });
    });
};
