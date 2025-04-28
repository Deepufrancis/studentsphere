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

// Get recent chats for a user.
router.get('/recent/:username', async (req, res) => {
  try {
    const username = req.params.username;
    console.log(`Fetching recent chats for user: ${username}`);
    
    // Find all chats where the user is a participant and has at least one message
    const chats = await Chat.find({
      participants: username,
      'messages.0': { $exists: true } // Only get chats with messages
    })
    .sort({ updatedAt: -1 }) // Sort by latest activity
    .limit(20); // Limit to 20 most recent chats

    console.log(`Found ${chats.length} chats for ${username}`);
    
    if (chats.length === 0) {
      return res.status(200).json([]);
    }

    const recentChats = chats.map(chat => {
      // Find the other participant in the conversation
      const otherParticipant = chat.participants.find(p => p !== username);
      // Get the last message in the chat
      const lastMessage = chat.messages[chat.messages.length - 1];
      
      return {
        chatId: chat._id,
        participant: otherParticipant,
        lastMessage: lastMessage ? {
          sender: lastMessage.sender,
          message: lastMessage.message,
          timestamp: lastMessage.timestamp
        } : null,
        updatedAt: chat.updatedAt
      };
    });

    res.status(200).json(recentChats);
  } catch (err) {
    console.error('Error fetching recent chats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch recent chats' });
  }
});

// Check if chat exists between users
router.get('/exists/:username/:otherUsername', async (req, res) => {
  try {
    const participants = [req.params.username, req.params.otherUsername].sort();
    
    const chat = await Chat.findOne({ 
      participants,
      'messages.0': { $exists: true } // Only count chats with messages
    });
    
    res.status(200).json({ exists: !!chat, chatId: chat?._id });
  } catch (err) {
    console.error('Error checking if chat exists:', err);
    res.status(500).json({ success: false, error: 'Failed to check chat existence' });
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

// Search for chats where a username is in participants (case-insensitive, partial match)
router.get('/search-participants/:query', async (req, res) => {
  try {
    const query = req.params.query;
    // Case-insensitive, partial match for participants
    const chats = await Chat.find({
      participants: { $elemMatch: { $regex: query, $options: 'i' } }
    });

    // Return chat _id and participants only for search results
    const results = chats.map(chat => ({
      chatId: chat._id,
      participants: chat.participants
    }));

    res.status(200).json(results);
  } catch (err) {
    console.error('Error searching participants:', err);
    res.status(500).json({ success: false, error: 'Failed to search participants' });
  }
});

module.exports = router;
