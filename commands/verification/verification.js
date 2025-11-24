const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder, AttachmentBuilder, PermissionsBitField } = require('discord.js');
const { CaptchaGenerator } = require('captcha-canvas');

module.exports = {
    name: 'verification',
    category: 'verification',
    premium: true,
    subcommand: ['setup', 'view', 'reset',],
    run: async (client, message, args) => {
        if (!message.member.permissions.has('Administrator')) {

            return message.channel.send({
      
                embeds: [
      
                    client.util.embed()
      
                        .setColor(client.color)
      
                        .setDescription(
      
                            `${client.emoji.cross} | You must have \`Administrator\` permissions to use this command.`
      
                        )
      
                ]
      
            });
      
        }
      
        if (!message.guild.members.me.permissions.has('Administrator')) { 
      
            return message.channel.send({
      
                embeds: [
      
                    embed
      
                        .setColor(client.color)
      
                        .setDescription(
      
                            `${client.emoji.cross} | I don't have \`Administrator\` permissions to execute this command.`
      
                        )
      
                ]
      
            })
      
        }
      
        if (!client.util.hasHigher(message.member)) {
      
            return message.channel.send({
      
                embeds: [
      
                    client.util.embed()
      
                        .setColor(client.color)
      
                        .setDescription(
      
                            `${client.emoji.cross} | You must have a higher role than me to use this command.`
      
                        )
      
                ]
      
            })
      
        }
      
        try {
            let data = await client.db.get(`verification_${message.guild.id}`) || { channelId: null, verifiedrole: null };

            if (!args[0]) {
                const embed = client.util.embed()
                    .setColor(0xff0000)
                    .setTitle('Verification Setup Error')
                    .setDescription('Please provide a valid option for setting up the verification system.\nValid Options Are: `setup`, `reset`, `view`')
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            const option = args[0]?.toLowerCase();

            // Setup option
            if (option === 'setup') {
                if (data.channelId || data.verifiedrole) {
                    const embed = client.util.embed()
                        .setColor(0xffcc00)
                        .setTitle('Verification Setup')
                        .setDescription('The verification system is already set up. Use the `reset` command to clear the existing setup first.')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }

                // Create the 'Verified' role if it doesn't exist
                let verifiedRole = message.guild.roles.cache.find(role => role.name === 'Verified');
                if (!verifiedRole) {
                    verifiedRole = await message.guild.roles.create({
                        name: 'Verified',
                        permissions: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    });
                }

                let verificationChannel = await message.guild.channels.create({
                    name: 'verification',
                    type: 0, 
                    permissionOverwrites: [
                        {
                            id: message.guild.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], 
                        },
                        {
                            id: verifiedRole.id,
                            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], 
                        }
                    ]
                });

                data.channelId = verificationChannel.id;
                data.verifiedrole = verifiedRole.id;
                await client.db.set(`verification_${message.guild.id}`, data);

                // Send the setup confirmation
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('start_verification')
                            .setLabel('Start Verification')
                            .setStyle(ButtonStyle.Primary)
                    );

                const embed = client.util.embed()
                    .setColor(client.color)
                    .setTitle('Verification Setup')
                    .setDescription('Click the button below to start the verification process.')
                    .setImage(client.config.verifybanner)
                    .setTimestamp();

                await verificationChannel.send({ embeds: [embed], components: [row] });
                await message.channel.send('Verification channel and role have been set up successfully.');
            }

            if (option === 'reset') {
                if(data) {
                if (data.channelId) {
                    const oldChannel = message.guild.channels.cache.get(data.channelId);
                    if (oldChannel) {
                        await oldChannel.delete();
                    }
                }

                 await client.db.delete(`verification_${message.guild.id}`);
                const embedReset = client.util.embed()
                    .setColor(client.color)
                    .setTitle('Verification Reset')
                    .setDescription('The verification configuration has been successfully reset.')
                    .setTimestamp();

                return message.channel.send({ embeds: [embedReset] });
            } else {
                if (!data.channelId || !data.verifiedrole) {
                    const embed = client.util.embed()
                        .setColor(0xffcc00)
                        .setTitle('Verification Not Set Up')
                        .setDescription('The verification system has not been set up yet.')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }
            }
        
        }

            if (option === 'view') {
                if (!data.channelId || !data.verifiedrole) {
                    const embed = client.util.embed()
                        .setColor(0xffcc00)
                        .setTitle('Verification Not Set Up')
                        .setDescription('The verification system has not been set up yet.')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }

                const embed = client.util.embed()
                    .setColor(client.color)
                    .setTitle('Verification System Details')
                    .setDescription(`Verification Channel: <#${data.channelId}>\nVerified Role: <@&${data.verifiedrole}>`)
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

        } catch (e) {
            const embedError = client.util.embed()
                .setColor(client.color)
                .setTitle('Error Occurred')
                .setDescription('An error occurred while processing the verification system command.')
                .setTimestamp();

            return message.channel.send({ embeds: [embedError] });
        }
    }
};
