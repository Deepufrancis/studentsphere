const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');

// Send a message (adds to the messages array)
router.post('/send', async (req, res) => {
  const { sender, receiver, message } = req.body;
  const participants = [sender, receiver].sort(); // maintain consistent order

  try {
    let chat = await Chat.findOne({ participants });

    if (!chat) {
      chat = new Chat({ participants, messages: [] });
    }

    chat.messages.push({ sender, message });
    await chat.save();

    res.status(200).json({ success: true, message: 'Message added' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Get messages between two users
router.get('/:user1/:user2', async (req, res) => {
  const participants = [req.params.user1, req.params.user2].sort();

  try {
    const chat = await Chat.findOne({ participants });

    if (!chat) {
      return res.status(200).json([]); // no chat yet
    }

    res.status(200).json(chat.messages);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Get recent chats for a user
router.get('/recent/:username', async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.params.username,
      'messages.0': { $exists: true } // Only get chats with messages
    })
    .sort({ updatedAt: -1 }) // Sort by latest activity
    .limit(20); // Limit to 20 most recent chats

    const recentChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(p => p !== req.params.username);
      const lastMessage = chat.messages[chat.messages.length - 1];
      
      return {
        chatId: chat._id,
        participant: otherParticipant,
        lastMessage: {
          sender: lastMessage.sender,
          message: lastMessage.message,
          timestamp: lastMessage.timestamp
        },
        updatedAt: chat.updatedAt
      };
    });

    res.status(200).json(recentChats);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch recent chats' });
  }
});

// Get all chats for a user
router.get('/all/:username', async (req, res) => {
  try {
    const allChats = await Chat.find({
      participants: req.params.username,
      'messages.0': { $exists: true } // Only get chats with messages
    }).sort({ 'messages.timestamp': -1 });

    const chatContacts = allChats.map(chat => {
      const otherParticipant = chat.participants.find(p => p !== req.params.username);
      const lastMessage = chat.messages[chat.messages.length - 1];
      
      return {
        participant: otherParticipant,
        lastMessage: {
          sender: lastMessage.sender,
          message: lastMessage.message,
          timestamp: lastMessage.timestamp
        },
        hasChat: true
      };
    });

    res.status(200).json(chatContacts);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
});

// Delete a message
router.delete('/:chatId/messages/:messageId', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const messageIndex = chat.messages.findIndex(
      msg => msg._id.toString() === req.params.messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    chat.messages.splice(messageIndex, 1);
    await chat.save();

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

module.exports = router;
