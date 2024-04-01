const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');
const http = require('http');

const dotenv = require('dotenv');
dotenv.config();

const { connectToDataBase } = require('./helpers/db');
const authRoutes = require('./routes/auth/routes');
const jobRoutes = require('./routes/job/routes');
const hireRoutes = require('./routes/hire/routes');
const profileRoutes = require('./routes/profile/routes');
const homeRoutes = require('./routes/home/routes');
const setupSocket = require('./helpers/socket.js');

const app = express();

app.use(cors());
const upload = multer();
app.use(upload.array());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/job', jobRoutes);
app.use('/hire', hireRoutes);
app.use('/profile', profileRoutes);
app.use('/home', homeRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: `http://localhost:${process.env.FRONTEND_PORT}`,
        methods: ["GET", "POST"]
    }
});

connectToDataBase().then(async () => {
    try {
        httpServer.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });

        setupSocket(io);
    }
    catch (err) {
        console.log("SERVER CONNECTION FAILED");
    }
}).catch(err => {
    console.log("DATABASE CONNECTION FAILED");
})

module.exports = app;

