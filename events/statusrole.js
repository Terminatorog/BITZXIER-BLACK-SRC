const StatusRoles = require('../models/Statusrole');
const { MessageEmbed, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');

// In-memory cache for vanity roles per guild
const statusRoleCache = new Map();
// Cooldown map: userId -> timeout
const cooldowns = new Map();
const COOLDOWN = 10 * 1000; // 10 seconds

module.exports = async (client) => {
  // Clean up cache when bot leaves a guild
  client.on('guildDelete', guild => {
    vanityRoleCache.delete(guild.id);
  });

  client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.guild) return;
    const guildId = newPresence.guild.id;
    let statusroles = statusRoleCache.get(guildId);
    if (!statusroles) {
      statusroles = await StatusRoles.findOne({ guildId });
      if (!statusroles) return;
      statusRoleCache.set(guildId, statusroles);
    }

    const userId = newPresence.userId;
    const customStatus = newPresence.activities?.find(a => a.type === 4);
    const statusText = customStatus?.state || '';
    const hasKeyword = statusText.toLowerCase().includes(statusroles.keyword.toLowerCase());

    const role = newPresence.guild.roles.cache.get(statusroles.roleId) || await newPresence.guild.roles.fetch(statusroles.roleId);
    if (!role || role.permissions.has(PermissionsBitField.Flags.Administrator) || role.permissions.has(PermissionsBitField.Flags.ManageGuild) || role.permissions.has(PermissionsBitField.Flags.ManageChannels)  || role.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers) || role.permissions.has(PermissionsBitField.Flags.ManageWebhooks) || role.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions) || role.permissions.has(PermissionsBitField.Flags.ManageNicknames) || role.permissions.has(PermissionsBitField.Flags.ManageGuildScheduledEvents) || role.permissions.has(PermissionsBitField.Flags.BanMembers) || role.permissions.has(PermissionsBitField.Flags.KickMembers)  || role.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await StatusRoles.findOneAndDelete({ guildId: newPresence.guild.id, roleId: statusroles.roleId });
      return;
    }
    const member = newPresence.guild.members.cache.get(userId) || await newPresence.guild.members.fetch(userId);
    if (!member) return;

    const logChannel = newPresence.guild.channels.cache.get(statusroles.logChannelId) || await newPresence.guild.channels.fetch(statusroles.logChannelId);

    // If on cooldown, schedule a check after cooldown if not already scheduled
    if (cooldowns.has(userId)) return;

    async function handleRoleAction() {
      // Fetch latest presence
      const freshMember = newPresence.guild.members.cache.get(userId) || await newPresence.guild.members.fetch(userId);
      const freshPresence = freshMember.presence;
      let freshStatusText = '';
      if (freshPresence) {
        const freshCustomStatus = freshPresence.activities?.find(a => a.type === 4);
        freshStatusText = freshCustomStatus?.state || '';
      }
      const stillHasKeyword = freshStatusText.toLowerCase().includes(statusroles.keyword.toLowerCase());
      if (stillHasKeyword && !freshMember.roles.cache.has(role.id)) {
        await freshMember.roles.add(role, `Status role added to the user cause they have the ${statusroles.keyword} in their status.`).catch(() => {});
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Status Role Update')
            .setDescription(`**${freshMember.user.tag}** has been assigned the status role.`)
            .addFields([
              { name: 'User', value: `<@${freshMember.id}>`, inline: true },
              { name: 'Role', value: `<@&${role.id}>`, inline: true },
              { name: 'Reason', value: `Status contains the keyword ${statusroles.keyword}`, inline: true }
            ])
            .setTimestamp()
            .setFooter({
              text: 'Status Role System',
              iconURL: client.user.displayAvatarURL()
            });
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } else if (!stillHasKeyword && freshMember.roles.cache.has(role.id)) {
        await freshMember.roles.remove(role, `Status role removed from the user cause they don't have the ${statusroles.keyword} in their status.`).catch(() => {});
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Status Role Update')
            .setDescription(`**${freshMember.user.tag}** has been removed from the status role.`)
            .addFields([
              { name: 'User', value: `<@${freshMember.id}>`, inline: true },
              { name: 'Role', value: `<@&${role.id}>`, inline: true },
              { name: 'Reason', value: `Status no longer contains the keyword ${statusroles.keyword}`, inline: true }
            ])
            .setTimestamp()
            .setFooter({
              text: 'Status Role System',
              iconURL: client.user.displayAvatarURL()
            });
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
      cooldowns.delete(userId);
    }

    // Set cooldown and schedule the action
    cooldowns.set(userId, setTimeout(handleRoleAction, COOLDOWN));
  });
};