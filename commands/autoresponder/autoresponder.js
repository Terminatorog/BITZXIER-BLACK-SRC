const { EmbedBuilder } = require('discord.js');
const Autoresponder = require('../../models/Autoresponder');

module.exports = {
    name: 'autoresponder',
    description: 'Manage autoresponder triggers.',
    category : 'autoresponder',
    subcommand : ['add','remove','list','reset'],
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
      
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('Autoresponder Management')
                .setColor(client.color)
                .setDescription('Please provide a valid subcommand.\n\n**Available Subcommands:**\n`add`, `remove`, `list`, `reset`')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        const subcommand = args.shift().toLowerCase();

        switch (subcommand) {
            case 'add':
                await handleAdd(message, args);
                break;
            case 'remove':
                await handleRemove(message, args);
                break;
            case 'list':
                await handleList(message);
                break;
            case 'reset':
                await handleReset(message);
                break;
            default:
                const embed = new EmbedBuilder()
                    .setTitle('Invalid Subcommand')
                    .setColor(message.client.color)
                    .setDescription('Please use one of the following subcommands:\n\n`add`, `remove`, `list`, `reset`')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                message.reply({ embeds: [embed] });
        }
    },
};

async function handleAdd(message, args) {
    if (args.length < 2) {
        const embed = new EmbedBuilder()
            .setTitle('Missing Arguments')
            .setColor(message.client.color)
            .setDescription('Please provide both a trigger and a response.')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    const trigger = args.shift();
    const response = args.join(' ');

    let autoresponder = await Autoresponder.findOne({ guildId: message.guild.id });
    if (!autoresponder) {
        autoresponder = new Autoresponder({ guildId: message.guild.id, triggers: [] });
    }

    // Check if the trigger already exists
    if (autoresponder.triggers.some(t => t.trigger.toLowerCase() === trigger.toLowerCase())) {
        const embed = new EmbedBuilder()
            .setTitle('Duplicate Trigger')
            .setColor(message.client.color)
            .setDescription(`The trigger \`${trigger}\` already exists. Please use a different trigger name.`)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    if (autoresponder.triggers.length === 40) {
        const embed = new EmbedBuilder()
            .setTitle('Autoresponder Limit Full')
            .setColor(message.client.color)
            .setDescription(`You can't add a new trigger because you've already reached the limit of \`40\` autoresponders.`)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    autoresponder.triggers.push({ trigger, response });
    await autoresponder.save();

    const embed = new EmbedBuilder()
        .setTitle('Autoresponder Trigger Added')
        .setColor(message.client.color)
        .setDescription('A new trigger has been added successfully.')
        .addFields(
            { name: 'Trigger', value: trigger, inline: true },
            { name: 'Response', value: response, inline: true }
        )
        .setFooter({ text: `Added by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleRemove(message, args) {
    if (args.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('Missing Arguments')
            .setColor(message.client.color)
            .setDescription('Please provide a trigger to remove.')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    const trigger = args.join(' ');

    const autoresponder = await Autoresponder.findOne({ guildId: message.guild.id });
    if (!autoresponder) {
        const embed = new EmbedBuilder()
            .setTitle('No Data Found')
            .setColor(message.client.color)
            .setDescription('No autoresponder data found for this guild.')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    const index = autoresponder.triggers.findIndex(t => t.trigger === trigger);
    if (index === -1) {
        const embed = new EmbedBuilder()
            .setTitle('Trigger Not Found')
            .setColor(message.client.color)
            .setDescription('The specified trigger was not found.')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    autoresponder.triggers.splice(index, 1);
    await autoresponder.save();

    const embed = new EmbedBuilder()
        .setTitle('Autoresponder Trigger Removed')
        .setColor(message.client.color)
        .setDescription('The trigger has been removed successfully.')
        .addFields({ name: 'Trigger', value: trigger })
        .setFooter({ text: `Removed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

    message.reply({ embeds: [embed] });
}

async function handleList(message) {
    const autoresponder = await Autoresponder.findOne({ guildId: message.guild.id });
    if (!autoresponder || autoresponder.triggers.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('No Triggers Found')
            .setColor(message.client.color)
            .setDescription('There are no triggers set for this guild.')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
        .setTitle('Autoresponder Triggers')
        .setColor(message.client.color)
        .setDescription(
            autoresponder.triggers.map(t => `**Trigger:** ${t.trigger}\n**Response:** ${t.response}`).join('\n')
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

        return message.client.util.ExcelPagination(embed, message.client, message)
}

async function handleReset(message) {
    await Autoresponder.deleteOne({ guildId: message.guild.id });

    const embed = new EmbedBuilder()
        .setTitle('Autoresponder Triggers Reset')
        .setColor(message.client.color)
        .setDescription('All triggers have been reset for this guild.')
        .setFooter({ text: `Reset by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

    message.reply({ embeds: [embed] });
}
