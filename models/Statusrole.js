const mongoose = require('mongoose');

const statusRoleSchema = new mongoose.Schema({
    guildId: {
        type: String,
        unique: true,
        index: true,
        required: true,
    },
    keyword: {
        type: String,
    },
    roleId: {
        type: String,
    },
    logChannelId: {
        type: String,
    }
});

module.exports = mongoose.model('StatusRole', statusRoleSchema); 