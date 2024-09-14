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

let lobbies = {};

// random code generated for lobby
function generateCode(){
    return Math.random().toString(36).substring(2,8).toUpperCase(); // all 36 a-z 1-9 characters, size 6, uppercased
}

// socket connection
io.use((socket, next) => {
    const user = socket.handshake.auth.token;
    const avatar = socket.handshake.auth.avatar;
    if(user){
        try{
            socket.data = { ... socket.data, user: user, avatar: avatar };
        } catch(err) {}
    }
    next();
});


io.on("connection", socket => {
    console.log("user connected: ", socket.data.user);

    socket.on("createLobby", () =>{
        let code = generateCode(); // generates code

        while(lobbies[code]){             // checks to see no other lobby w/ code
            code = generateCode();
        }

        lobbies[code] = {
            host: socket.data.user,
            users: [socket.data.user],
            poll: [
                {
                    id: 1,
                    question: "What is your current top priority for your meal?",
                    options: [
                        { id: 1, text: "Ambiance", votes: [] },
                        { id: 2, text: "Budget", votes: [] },
                        { id: 3, text: "Cuisine", votes: [] },
                        { id: 4, text: "Distance", votes: [] },
                    ],
                },
                {
                    id: 2,
                    question: "What kind of ambiance are you looking for?",
                    options: [
                        { id: 1, text: "Casual and Cozy", votes: [] },
                        { id: 2, text: "Trendy and Modern", votes: [] },
                        { id: 3, text: "Romantic and Intimate", votes: [] },
                        { id: 4, text: "Family-friendly", votes: [] },
                        { id: 5, text: "Lively and Social", votes: [] },
                    ],
                },
                {
                    id: 3,
                    question: "What is your preferred price range?",
                    options: [
                        { id: 1, text: "$", votes: [] },
                        { id: 2, text: "$$", votes: [] },
                        { id: 3, text: "$$$", votes: [] },
                        { id: 4, text: "$$$$", votes: [] },
                    ],
                },
                {
                    id: 4,
                    question: "What type of cuisine are you in the mood for?",
                    options: [
                        { id: 1, text: "Italian", votes: [] },
                        { id: 2, text: "Mexican", votes: [] },
                        { id: 3, text: "Chinese", votes: [] },
                        { id: 4, text: "Japanese", votes: [] },
                        { id: 5, text: "Mediterranean", votes: [] },
                        { id: 6, text: "American", votes: [] },
                        { id: 7, text: "French", votes: [] },
                        { id: 8, text: "Thai", votes: [] },
                    ],
                },
                {
                    id: 5,
                    question: "How far are you willing to travel?",
                    options: [
                        { id: 1, text: "Walking distance (0-1 miles)", votes: [] },
                        { id: 2, text: "Short drive (1-5 miles)", votes: [] },
                        { id: 3, text: "Moderate drive (5-15 miles)", votes: [] },
                        { id: 4, text: "Long drive (15+ miles)", votes: [] },
                    ],
                },
            ],
        };

        socket.join(code);
        socket.emit("lobbyCreated", code);

        console.log(`Lobby created with code: ${code}`);
    });

    socket.on("joinLobby", ({ lobbyCode }) => {
        if(lobbies[lobbyCode]) {
            socket.join(lobbyCode);

            lobbies[lobbyCode].users.push(socket.data.user);
            const lobby = lobbies[lobbyCode];

            io.to(lobbyCode).emit("lobbyInfo", { // I don't think I need this just pass users and host
                code: lobbyCode,
                users: lobby.users,
                host: lobby.host,
            });

            io.to(lobbyCode).emit("lobbyJoined", lobbyCode); // why am I passing the lobbyCode?? should be socket.data.user info check for any errors

            console.log(`User ${socket.data.user} joined lobby ${lobbyCode}`);
        }
        else{
            socket.emit('Error', 'Error with joinLobby');
        }
    });

    socket.on("updateLobby", ({ lobbyCode }) => {
        if(lobbies[lobbyCode]){
            const lobby = lobbies[lobbyCode];
            io.to(lobbyCode).emit("lobbyInfo", {
                code: lobbyCode,
                users: lobby.users,
                host: lobby.host,
            });
            console.log(`Updated lobby information on Lobby: ${lobbyCode}`)
        }
        else{
            socket.emit('Error', "Error with updateLobby");
        }
    });

    socket.on("startGame", ({ lobbyCode }) => {
        io.to(lobbyCode).emit("gameStarted")
    });

    socket.on("getPollData", ({ lobbyCode }) => {
        if (lobbies[lobbyCode]) {
            const lobby = lobbies[lobbyCode];

            io.to(lobbyCode).emit("setPoll", {
                questions: lobby.poll,
            });

            console.log(`Sent poll to lobby: ${lobbyCode}`);
        } else {
            console.log("Lobby not found for code:", lobbyCode);
            socket.emit('Error', "Error with getPollData");
        }
    });

    socket.on("getTotalUsers", ({ lobbyCode }) => {
        if(lobbies[lobbyCode]){
            const lobby = lobbies[lobbyCode];
            const total = lobby.users.length;

            io.to(lobbyCode).emit("setTotalUsers", total);
        } else {
            console.log("Lobby not found for code:", lobbyCode);
            socket.emit('Error', "Error with getTotalUsers")
        }
    });


    socket.on("vote",( { optionId, currentQuestion, lobbyCode } ) => {
        const lobby = lobbies[lobbyCode];

        if(!lobby){
            return socket.emit('Error', "Error with vote, no lobby");
        }

        // gets the poll question
        // console.log(lobby.poll[currentQuestion]);

        // gets the answers
        // console.log(lobby.poll[currentQuestion].options[optionId - 1]);

        // gets the answers vote
        // console.log(lobby.poll[currentQuestion].options[optionId - 1].votes)


    });

    socket.on("disconnect", () =>{
        for (const [code, lobby] of Object.entries(lobbies)) {
            if (lobby.users.includes(socket.data.user)) {
                lobby.users = lobby.users.filter(user => user !== socket.data.user);
                if (lobby.users.length === 0) {
                    delete lobbies[code]; // Remove the lobby if no users left
                    console.log(`Lobby with code ${code} has been removed`)
                } else {
                    socket.broadcast.to(code).emit("userDisconnect", socket.data.user);
                }
                break;
            }
        }
        console.log("user disconnected: ", socket.data.user);
    });

});

server.listen(8000, () => {
    console.log("Listening on Port:8000");
});
