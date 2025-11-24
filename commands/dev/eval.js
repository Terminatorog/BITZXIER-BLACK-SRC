const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const os = require('os');
const fs = require('fs');
const axios = require('axios'); 
const _ = require('lodash'); 
module.exports = {
    name: 'eval',
    aliases: ['ev', 'jaduexe'],
    category: 'owner',
    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) return;

        const option = args[0];
        const content = args.slice(1).join(' ');

        if (!option) {
            const uptime = Math.round(client.uptime / 1000);
            const processMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            const botInfo = `
Sairaj v1.0.1, discord.js \`${require('discord.js').version}\`, Node.js \`${process.version}\` on \`${os.type().toLowerCase()} ${os.arch()}\`
Process started at <t:${Math.floor((Date.now() - process.uptime() * 1000) / 1000)}:R>, bot was ready at <t:${Math.floor(Date.now() / 1000 - uptime)}:R>

Using **${processMemory}MB** at this process.
Running on PID **${process.pid}**

This bot is ${client.cluster ? '**sharded**' : '**not sharded**'} and can see ${client.guilds.cache.size} guild(s) and ${client.users.cache.size} user(s).
\`GuildPresences\` intent is ${client.options.intents.has('GuildPresences') ? 'enabled' : 'disabled'}, \`GuildMembers\` intent is ${client.options.intents.has('GuildMembers') ? 'enabled' : 'disabled'}, and \`MessageContent\` intent is ${client.options.intents.has('MessageContent') ? 'enabled' : 'disabled'}.
Average websocket latency: ${client.ws.ping}ms
            `;
            return message.channel.send({ content: `${botInfo}` });
        }

        const paginate = async (message, content) => {
            const pages = content.match(/[\s\S]{1,2000}/g) || [];
            let page = 0;

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`\`\`js\n${pages[page]}\`\`\``)

            if (content.length > 4000) {
                embed.setFooter({ text: `Page ${page + 1} of ${pages.length}` });
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Prev')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(page === pages.length - 1)
                    );

                const messageEmbed = await message.channel.send({
                    embeds: [embed],
                    components: [row],
                });

                const collector = messageEmbed.createMessageComponentCollector({
                    filter: (i) => i.user.id === message.author.id,
                    time: 60000,
                });

                collector.on('collect', async (interaction) => {
                    if (interaction.customId === 'prev' && page > 0) {
                        page--;
                    } else if (interaction.customId === 'next' && page < pages.length - 1) {
                        page++;
                    } else if (interaction.customId === 'stop') {
                        collector.stop();
                        await interaction.update({ components: [] });
                        return;
                    }

                    embed.setDescription(`\`\`\`js\n${pages[page]}\`\`\``);
                    embed.setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                    row.components[0].setDisabled(page === 0);
                    row.components[2].setDisabled(page === pages.length - 1);

                    await interaction.update({ embeds: [embed], components: [row] });
                });

                collector.on('end', async () => {
                    await messageEmbed.edit({ components: [] });
                });
            } else {
                // If content is within 4000 characters, send without buttons
                await message.channel.send({ embeds: [embed] });
            }
        };

        try {
            let output;

            switch (option) {
                case 'js':
                    output = await eval(content);
                    output = require('util').inspect(output, { depth: 0 });
                    break;
                case 'exec':
                    output = await new Promise((resolve, reject) => {
                        exec(content, (error, stdout, stderr) => {
                            if (error) reject(error.message);
                            else resolve(stdout || stderr);
                        });
                    });
                    break;
                case 'cat':
                    output = fs.readFileSync(content, 'utf-8');
                    break;
                case 'curl':
                    const response = await axios.get(content);
                    output = require('util').inspect(response.data, { depth: 1 });
                    break;
                default:
                    output = `Invalid option. Available options: \`js\`, \`exec\`, \`cat\`, \`curl\``;
            }

            output = output.replaceAll(client.token, 'T0K3N')
                .replaceAll(client.config.MONGO_DB, 'T0K3N');
            await paginate(message, output);
        } catch (err) {
            const errorEmbed = new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`\`\`\`js\n${err.toString().replaceAll(client.token, 'T0K3N').replaceAll(this.config.MONGO_DB, 'T0K3N')}\`\`\``);

            message.channel.send({ embeds: [errorEmbed] });
        }
    },
};
