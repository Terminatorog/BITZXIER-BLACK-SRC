const { AuditLogEvent } = require('discord.js');

module.exports = async (client) => {
    client.on('guildBanAdd', async (ban) => {
        try {
            const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
            const logEntry = auditLogs?.entries?.first();
            if (!logEntry) return;

            const { executor, target, createdTimestamp } = logEntry;
            const difference = Date.now() - createdTimestamp;
            if (difference > 3600000) return; // Ignore old logs

            const isWhitelisted = await client.db.get(`${ban.guild.id}_${executor.id}_wl`);
            const antinukeEnabled = await client.db.get(`${ban.guild.id}_antinuke`);
            if (!antinukeEnabled && !antinukeEnabled.antiban) return;
            if (isWhitelisted?.ban || executor.id === ban.guild.ownerId || executor.id === client.user.id) return;

            const panicMode = await client.db.get(`panic_${ban.guild.id}`);
            if (panicMode) {
                await handlePanicMode(client, ban, executor, target);
            } else {
                await normalModeAction(client, ban, executor, target);
            }
        } catch (err) {
            console.error("Error handling guildBanAdd event:", err);
        }
    });
};

async function handlePanicMode(client, ban, executor, target) {
    try {
        const member = await ban.guild.members.fetch(executor.id).catch(() => null);
        if (!member) return;

        const perms = member.roles.cache.filter(role => 
            role.permissions.has('Administrator') || role.permissions.has('BanMembers')
        );

        const quarantineRole = await getOrCreateQuarantineRole(ban.guild);
        const action = await client.db.get(`panicp_${ban.guild.id}`);
        
        if (action && action.data === 'ban') {
            await handleBanAction(client, ban, executor, target, member, perms);
        } else if (action && action.data === 'quarantine') {
            await handleQuarantineAction(client, ban, executor, target, member, quarantineRole, perms);
        }
    } catch (err) {
        console.error('Error handling panic mode:', err);
    }
}

async function handleBanAction(client, ban, executor, target, member, perms) {
  executor.guild = ban.guild   
    await Promise.all([
        unbanMember(client, ban, target),
        removeDangerousPermissions(client, member, perms, executor.bot),
        client.util.FuckYou(executor, 'Panic Mode | Anti Member Ban | Not Whitelisted')
    ]);
}

async function handleQuarantineAction(client, ban, executor, target, member, quarantineRole, perms) {
    executor.guild = ban.guild   
    await Promise.all([
        unbanMember(client, ban, target),
        quarantineMember(client, member, quarantineRole, perms, executor.bot)
    ]);
}

async function normalModeAction(client, ban, executor, target) {
    try {
        executor.guild = ban.guild   
        await Promise.all([
            unbanMember(client, ban, target),
         client.util.FuckYou(executor, 'Member Ban | Not Whitelisted')
        ]);
    } catch (err) {
        console.error('Error in normal mode action:', err);
    }
}

async function unbanMember(client, ban, target) {
    try {
        await ban.guild.members.unban(target.id, 'Panic Mode | Auto Recovery').catch(() => null);
    } catch (err) {
        console.error('Error unbanning member:', err);
    }
}

async function removeDangerousPermissions(client, member, perms, isBot) {
    const tasks = perms.map(role => 
        role.setPermissions([], 'Panic Mode | Anti Member Ban | Not Whitelisted').catch(() => null)
    );
    
    if (!isBot) {
        tasks.push(...perms.map(role => 
            member.roles.remove(role.id).catch(() => null)
        ));
    }

    await Promise.all(tasks);
}

async function quarantineMember(client, member, quarantineRole, perms, isBot) {
    const tasks = [];

    if (isBot) {
        member.roles.cache.forEach(async (role) => {
            if (role.id !== member.guild.roles.everyone.id && !role.managed) {
                tasks.push(member.roles.remove(role.id, 'Panic Mode | Anti Member Ban | Not Whitelisted').catch(() => null));
            }
        });
    } else {
        tasks.push(member.roles.set([quarantineRole.id], 'Panic Mode | Anti Member Ban | Not Whitelisted').catch(() => null));
    }

    tasks.push(...perms.map(role => 
        role.setPermissions([], 'Panic Mode | Anti Member Ban | Not Whitelisted').catch(() => null)
    ));

    await Promise.all(tasks);
}

async function getOrCreateQuarantineRole(guild) {
    let role = guild.roles.cache.find(role => role.name === 'Quarantine');
    if (!role) {
        role = await guild.roles.create({
            name: 'Quarantine',
            color: '#b38844',
            permissions: [],
            reason: 'Panic Mode | Quarantine System'
        }).catch(() => null);
    }

    if (role && (role.permissions.has('BanMembers') || role.permissions.has('Administrator'))) {
        await role.setPermissions([], 'Removing Dangerous Permissions From Quarantine Role').catch(() => null);
    }

    return role;
}

