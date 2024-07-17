const cors = require("cors");
const express = require("express");
const { Server } = require("socket.io");


const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
const server = require("http").createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const poll = {
    question: "What is your current top priority for your meal?",
    options: [
        {
            id: 1,
            text: "Ambiance",
            votes:[],
        },
        {
            id: 2,
            text: "Budget",
            votes:[],
        },
        {
            id: 3,
            text: "Cuisine",
            votes:[],
        },
        {
            id: 4,
            text: "Distance",
            votes:[],
        },
    ]
}

io.use(addUser);

function addUser(socket, next) {
    const user = socket.handshake.auth.token;
    if (user) {
        try {
            socket.data = { ...socket.data, user: user };
        } catch (err) {}
    }
    next();
}

let lobbies = {};

io.on("connection", (socket) => {
    console.log("a user connected", socket.data.user);

    socket.on("updateState", () => {
        console.log("client asked For State Update");
        socket.emit("updateState", poll);
    });

    socket.on("vote", (optionId) => {
        poll.options.forEach((option) => {
            option.votes = option.votes.filter((user) => user !== socket.data.user);
        });
        const option = poll.options.find((o) => o.id === optionId);
        if (!option) {
            return;
        }
        option.votes.push(socket.data.user);
        io.emit("updateState", poll);
    });

    socket.on("disconnect", () => {
        console.log("user is disconnected");
    });
});

server.listen(8000, () => {
    console.log("Listening on Port:8000");
});
