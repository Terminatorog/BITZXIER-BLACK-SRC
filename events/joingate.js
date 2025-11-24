const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder, AttachmentBuilder,PermissionsBitField } = require('discord.js');
const { CaptchaGenerator } = require('captcha-canvas');

// Global map to store captcha texts
const captchaMap = new Map();

module.exports = async (client) => {



    client.on('interactionCreate', async (interaction) => {
        // Handle button interaction
        if (interaction.isButton()) {
            const { guild, member } = interaction;
            const data = await client.db.get(`verification_${guild.id}`);
            if (!data || interaction.customId !== 'start_verification') return;

            // Defer the reply to acknowledge the interaction
            await interaction.deferReply({ ephemeral: true });

            // Generate a captcha code
            const captchaText = generateRandomText(6);
            const captcha = new CaptchaGenerator()
                .setDimension(150, 450) // Corrected dimensions
                .setCaptcha({ text: captchaText, size: 60, color: "#000000" })
                .setDecoy({ size: 40, total: 20, opacity: 0.5 })
                .setTrace({ color: "#000000" });

            const buffer = captcha.generateSync();
            const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });

            const embed = client.util.embed()
                .setColor(client.color)
                .setTitle(`${client.emoji.verification} Hello! Are you human? Let's find out!\n\`Please type the captcha below to be able to access this server!Captcha Verification\`\n**Additional Notes:**\n`)
                .setDescription(`${client.emoji.tracedcolor} Type out the traced colored characters from left to right.\n ${client.emoji.decoy} Ignore the decoy characters spread-around.\n ${client.emoji.cases}You have to respect characters cases (upper/lower case)!`)
                .setImage('attachment://captcha.png')
                .setFooter({ text : 'Verification Period: 1 minutes'})
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('show_verification_modal')
                        .setLabel('Enter Code')
                        .setStyle(ButtonStyle.Primary)
                );

            const verificationChannel = guild.channels.cache.get(data.channelId);
            if (!verificationChannel) {
                await interaction.followUp({ content: 'Verification channel not found.', ephemeral: true });
                return;
            }

            await interaction.followUp({ embeds: [embed], components: [row], files: [attachment] });

            // Store captcha text in the map
            captchaMap.set(member.id, captchaText);

            // Handle the button to show the modal
            const filter = i => i.customId === 'show_verification_modal' && i.user.id === member.id;
            const collector = verificationChannel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'show_verification_modal') {
                    const modal = new ModalBuilder()
                        .setCustomId('verify_captcha')
                        .setTitle('Verify Yourself')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('captcha_code')
                                    .setLabel('Enter the code shown in the image')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                            )
                        );

                    await i.showModal(modal);
                }
            });

            collector.on('end',async  collected => {
                if (!collected.size) {
                   let ok = await verificationChannel.send('Verification process timed out.')
                   await client.util.sleep(3000) 
                   await ok.delete()
                   captchaMap.delete(member.id);
                }
            });
        }

        // Handle modal submission interaction
        if (interaction.isModalSubmit() && interaction.customId === 'verify_captcha') {
            const { member, guild } = interaction;
            const enteredCode = interaction.fields.getTextInputValue('captcha_code');
            const data = await client.db.get(`verification_${interaction.guild.id}`);

            const storedCaptchaText = captchaMap.get(member.id);

            if (enteredCode === storedCaptchaText) {
                let role = guild.roles.cache.get(data.verifiedrole)
                const restrictedPermissions = [
                    'KickMembers',
                    'BanMembers',
                    'Administrator',
                    'ManageChannels',
                    'ManageGuild',
                    'MentionEveryone',
                    'ManageRoles',
                    'ManageWebhooks',
                    'ManageEvents',
                    'ModerateMembers',
                ];
                const rolePermissions = new PermissionsBitField(role.permissions.bitfield)
                    .toArray()
                    .filter((perm) => restrictedPermissions.includes(perm))
                    .map((perm) => `\`${perm}\``)
                    .join(', ');
            
                if (rolePermissions.length > 0) {
                    interaction.reply({
                        embeds: [
                            client.util.embed()
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} | I can't add <@&${role.id}> to you because it has ${rolePermissions} permissions\nPlease contact the server admin or owner to resolve this issue`
                                )
                        ],
                    ephemeral : true })
                    if(role.editable) {
                        await role.setPermissions([
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak,
                        ],'Dangerous permissions have been successfully removed from the Verified role to ensure enhanced security')
                    }
                }
            
                if(role && role.position < guild.members.me.roles.highest.position && !rolePermissions.length > 0){
                await member.roles.add(role.id,'Successfully Passed the Verification System');
                await interaction.reply({ content: 'You have been successfully verified!', ephemeral: true });
                captchaMap.delete(member.id);
                } else {
                    interaction.reply({ content : `I’m unable to assign this role because its position is higher than or equal to my highest role position. Please contact the server admin or owner to resolve this issue.`, ephemeral : true})
                }
            } else {
                await interaction.reply({ content: 'Verification failed. Please try again.', ephemeral: true });
            }
        }
    });
};

function generateRandomText(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
