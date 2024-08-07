const mongoose = require('mongoose');

const subscribedUsers = new mongoose.Schema({
    userId: String,     // UserID from the users collection
    subscriptionDate: { type: Date, default: Date.now }, // Timestamp when the user subscribed
    isSubscribed: { type: Boolean, default: true }
});

const tagSchema = new mongoose.Schema({
    tagName: String,
    tagID: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    categoryID: String,
    isActive: { type: Boolean, default: true },
    usersSubscribed: [subscribedUsers]
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
