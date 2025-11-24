const mongoose = require("mongoose");

const SetupSchema = new mongoose.Schema({
  guildId: {
    type: String,
    default: null,
  },
  channelId: {
    type: String,
    default: null,
  },
  messageId: {
    type: String,
    default: null,
  },
  prefixz: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("setup", SetupSchema);
