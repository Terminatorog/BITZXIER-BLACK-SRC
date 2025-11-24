const mongoose = require('mongoose');

const triggerSchema = new mongoose.Schema({
    trigger: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    }
});

const autoresponderSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    triggers: [triggerSchema]
});

module.exports = mongoose.model('Autoresponder', autoresponderSchema);
