const mongoose = require('mongoose');

const stickySchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    messageId: String,  // This field stores the ID of the last posted sticky message
    content: String,
  });
  
  module.exports = mongoose.model('Sticky', stickySchema);
  