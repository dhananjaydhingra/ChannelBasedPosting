const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001;
app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'Posting'
});


db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Server');

    db.query("CREATE DATABASE IF NOT EXISTS Posting", function (err, result) {
        if (err) throw err;
        console.log("Database created or already exists");

        db.query("USE Posting", function (err, result) {
            if (err) throw err;
            console.log("Using the 'Posting' database");

           
            const createUserTableSql = `
            CREATE TABLE IF NOT EXISTS user (
                user_id INT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            )`;
        
        const createChannelTableSql = `
            CREATE TABLE IF NOT EXISTS channel (
                channel_id INT PRIMARY KEY AUTO_INCREMENT,
                channelname VARCHAR(255) NOT NULL,
                user_id INT  NULL,
                FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE SET NULL
            )`;
        
        const createMessagesTableSql = `
            CREATE TABLE IF NOT EXISTS messages (
                message_id INT PRIMARY KEY AUTO_INCREMENT,
                message_content TEXT,
                channel_id INT NULL, 
                user_id INT NULL,
                username VARCHAR(255),
                likes INT DEFAULT 0,
                dislikes INT DEFAULT 0,
                images VARCHAR(255),
                FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES channel(channel_id) ON DELETE CASCADE
            )`;
        
        const createRepliesTableSql = `
            CREATE TABLE IF NOT EXISTS replies (
                replies_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                message_id INT NOT NULL,
                reply_content TEXT,
                images VARCHAR(255),
                likes INT DEFAULT 0,
                dislikes INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
            )`;
        
            
            db.query(createUserTableSql, function (err, result) {
                if (err) throw err;
                console.log("User table created or already exists");
            });

            db.query(createChannelTableSql, function (err, result) {
                if (err) throw err;
                console.log("Channel table created or already exists");
            });

            db.query(createMessagesTableSql, function (err, result) {
                if (err) throw err;
                console.log("Messages table created or already exists");
            });

            db.query(createRepliesTableSql, function (err, result) {
                if (err) throw err;
                console.log("Replies table created or already exists");
            });
        });
    });
});





app.post('/login', (req, res) => {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
        return res.status(400).json({ status: 'error', message: 'Please provide user_id and password' });
    }

    const query = 'SELECT * FROM user WHERE user_id = ? AND password = ?';
  
    db.query(query, [user_id, password], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }

        if (result.length > 0) {
            res.json({ status: 'success', message: 'Login successful', user_id: result[0].user_id, username: result[0].username });
        } else {
            res.json({ status: 'error', message: 'Invalid credentials' });
        }
    });
});




app.post('/signup', (req, res) => {
    const { name, user_id, password } = req.body;

    if (!name || !user_id || !password) {
        return res.status(400).json({ status: 'error', message: 'Please provide name, user_id, and password' });
    }
    const userCheckQuery = 'SELECT * FROM user WHERE user_id = ?';
    db.query(userCheckQuery, [user_id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }

        if (result.length > 0) {
            return res.status(400).json({ status: 'error', message: 'User ID already exists' });
        } else {
            const insertQuery = 'INSERT INTO user (username, user_id, password) VALUES (?, ?, ?)';
            db.query(insertQuery, [name, user_id, password], (err, result) => {
                if (err) {
                    console.error('Database query error:', err);
                    return res.status(500).json({ status: 'error', message: 'Internal server error' });
                }
                res.json({ status: 'success', message: 'User created successfully' });
            });
        }
    });
});




app.post('/createChannel', (req, res) => {
    const { channel_name, user_id } = req.body;

    if (!channel_name || !user_id) {
        return res.status(400).json({ status: 'error', message: 'Missing information' });
    }

    const query = 'INSERT INTO channel (channelname, user_id) VALUES (?, ?)';

    db.query(query, [channel_name, user_id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Channel created successfully' });
    });
});




app.delete('/deleteChannel/:channelId', (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.body.userId; 
    if (userId!== 1) { 
        return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const query = 'DELETE FROM channel WHERE channel_id = ?';

    db.query(query, [channelId], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Channel deleted successfully' });
    });
});



app.delete('/deleteMessage/:messageId', (req, res) => {
    const messageId = req.params.messageId;
    const userId = req.body.userId;
    if (userId !== 1) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const query = 'DELETE FROM messages WHERE message_id = ?';
    db.query(query, [messageId], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Message deleted successfully' });
    });
});



app.post('/postMessage', (req, res) => {
    console.log(req.body);
    const { message_content, channel_id, user_id, username, likes, dislikes, image } = req.body;


    console.log("Received data:", req.body); 

    const query = 'INSERT INTO messages (message_content, channel_id, user_id, username, likes, dislikes, images) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [message_content, channel_id, user_id, username, likes, dislikes, image], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error', error: err });
        }
        res.json({ status: 'success', message: 'Message posted successfully' });
    });
});




app.post('/messages/:messageId/like', (req, res) => {
    const messageId = req.params.messageId;

    if (!messageId || isNaN(Number(messageId))) {
        return res.status(400).json({ status: 'error', message: 'Invalid or missing message ID' });
    }

    const query = 'UPDATE messages SET likes = likes + 1 WHERE message_id = ?';

    db.query(query, [Number(messageId)], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Like updated successfully' });
    });
});



app.post('/postReply', (req, res) => {
    const { user_id, message_id, reply_content, image } = req.body;

    const query = 'INSERT INTO replies (user_id, message_id, reply_content, images) VALUES (?, ?, ?, ?)';

    db.query(query, [user_id, message_id, reply_content, image], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Reply posted successfully' });
    });
});



app.post('/replies/:replyId/like', (req, res) => {
    const replyId = req.params.replyId;
    const query = 'UPDATE replies SET likes = likes + 1 WHERE replies_id = ?';
    db.query(query, [Number(replyId)], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Like updated successfully' });
    });
});



app.post('/replies/:replyId/dislike', (req, res) => {
    const replyId = req.params.replyId;
    const query = 'UPDATE replies SET dislikes = dislikes + 1 WHERE replies_id = ?';
    db.query(query, [Number(replyId)], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Dislike updated successfully' });
    });
});




app.post('/messages/:messageId/dislike', (req, res) => {
    const messageId = req.params.messageId;

    if (!messageId || isNaN(Number(messageId))) {
        return res.status(400).json({ status: 'error', message: 'Invalid or missing message ID' });
    }

    const query = 'UPDATE messages SET dislikes = dislikes + 1 WHERE message_id = ?';

    db.query(query, [Number(messageId)], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'Dislike updated successfully' });
    });
});



app.get('/channels', (req, res) => {
    const query = `
        SELECT c.channel_id, c.channelname, u.username 
        FROM channel c 
        JOIN user u ON c.user_id = u.user_id`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', channels: results });
    });
});




app.get('/userPostsCount/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log("Fetching post count for user ID:", userId);
    const query = 'SELECT COUNT(*) as postCount FROM messages WHERE user_id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', postCount: result[0].postCount });
    });
});




app.get('/messages', (req, res) => {
    const query = 'SELECT * FROM messages WHERE channel_id = ?';
    const channel_id = req.query.channel_id; 
    db.query(query, [channel_id], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', messages: result });
    });
});



app.get('/channelStats/:channelId', async (req, res) => {
    const channelId = req.params.channelId;
    const query = `
        SELECT m.user_id, u.username, COUNT(*) as post_count 
        FROM messages m
        JOIN user u ON m.user_id = u.user_id
        WHERE channel_id = ? 
        GROUP BY m.user_id, u.username
        ORDER BY post_count DESC
    `;

    try {
        const [rows] = await db.promise().query(query, [channelId]);
        if (rows.length > 0) {
            const highestPostsUser = rows[0];
            const lowestPostsUser = rows[rows.length - 1];
            res.json({
                status: 'success',
                stats: {
                    highestPostsUser: highestPostsUser.username,
                    highestPostCount: highestPostsUser.post_count,
                    lowestPostsUser: lowestPostsUser.username,
                    lowestPostCount: lowestPostsUser.post_count
                }
            });
        } else {
            res.json({
                status: 'success',
                message: 'No posts in this channel'
            });
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});



app.get('/getReplies/:messageId', (req, res) => {
    const messageId = req.params.messageId;
    const query = 'SELECT r.*, u.username FROM replies r JOIN user u ON r.user_id = u.user_id WHERE message_id = ?';

    db.query(query, [messageId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', replies: results });
    });
});



app.get('/users', (req, res) => {
    const query = 'SELECT * FROM user';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', users: results });
    });
});



app.delete('/deleteUser/:userId', (req, res) => {
    const userIdToDelete = req.params.userId;
    const adminUserId = req.body.adminUserId; 
    if (adminUserId !== 1) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const query = 'DELETE FROM user WHERE user_id = ?';

    db.query(query, [userIdToDelete], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
        res.json({ status: 'success', message: 'User deleted successfully' });
    });
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});