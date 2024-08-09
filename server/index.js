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

const lobbies = {};

function generateCode(){
    return Math.random().toString(36).substring(2,8).toUpperCase(); // all 36 a-z 1-9 characters, size 6, uppercased
}

io.use((socket, next) => {
    const user = socket.handshake.auth.token;
    if(user){
        try{
            socket.data = { ... socket.data, user: user };
        } catch(err) {}
    }
    next();
});


io.on("connection", socket => {
    console.log("user connected: ", socket.data.user);

    socket.on("createLobby", () =>{
        let code = generateCode(); // generates code

        while(lobbies[code]){             // checks to see no other lobby w/code
            code = generateCode();
        }

        lobbies[code] = {
            host: socket.data.user,
            users: [socket.data.user],
            poll: {
                question: "What is your current top priority for your meal?",
                options: [
                    { id: 1, text: "Ambiance", votes: [] },
                    { id: 2, text: "Budget", votes: [] },
                    { id: 3, text: "Cuisine", votes: [] },
                    { id: 4, text: "Distance", votes: [] },
                ],
            },
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

            io.to(lobbyCode).emit("lobbyInfo", {
                code: lobbyCode,
                users: lobby.users,
                host: lobby.host,
            });

            io.to(lobbyCode).emit("userJoined", lobbyCode);

            console.log(`User ${socket.data.user} joined lobby ${lobbyCode}`);
        }
        else{
            socket.emit('Error', 'Lobby not found');
        }
    });

    socket.on("updateLobby", ({ lobbyCode }) =>{
        if(lobbies[lobbyCode]){
            socket.join(lobbyCode);
            const lobby = lobbies[lobbyCode];
            io.to(lobbyCode).emit("lobbyInfo", {
                code: lobbyCode,
                users: lobby.users,
                host: lobby.host,
            });

            console.log(`Updated lobby information on Lobby: ${lobbyCode}`)

        }
        else{
            socket.emit('Error', "Lobby not found");
        }
    })

    socket.on("disconnect", () =>{
        for (const [code, lobby] of Object.entries(lobbies)) {
            if (lobby.users.includes(socket.data.user)) {
                lobby.users = lobby.users.filter(user => user !== socket.data.user);
                if (lobby.users.length === 0) {
                    delete lobbies[code]; // Remove the lobby if no users left
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



// function createLobby(host) {
//     const code = generateCode();
//     lobbies[code] = {
//         host,
//         users: [host],
//         poll: {
//             question: "What is your current top priority for your meal?",
//             options: [
//                 { id: 1, text: "Ambiance", votes: [] },
//                 { id: 2, text: "Budget", votes: [] },
//                 { id: 3, text: "Cuisine", votes: [] },
//                 { id: 4, text: "Distance", votes: [] },
//             ],
//         },
//     };
//     return code;
// }

// io.on("connection", (socket) => {
//     console.log("a user connected", socket.data.user);
//
//
//     socket.on("createLobby", (hostName) => {
//         const code = createLobby(hostName);
//         socket.join(code);
//         socket.emit("lobbyCreated", code);
//         io.to(code).emit("updateState", { ...lobbies[code], code });
//     });
//
//     socket.on("joinLobby", ({ name, code }) => {
//         if (!lobbies[code]) {
//             socket.emit("error", "Lobby not found");
//             return;
//         }
//         lobbies[code].users.push(name);
//         socket.join(code);
//         socket.emit("joinedLobby", code);
//         io.to(code).emit("updateState", { ...lobbies[code], code });
//     });
//
//     socket.on("vote", ({ code, optionId }) =>{
//         const lobby = lobbies[code];
//         if (!lobby) return;
//
//         const { poll } = lobby;
//         poll.options.forEach((option) => {
//             option.votes = option.votes.filter((user) => user !== socket.data.user);
//         });
//         const option = poll.options.find((o) => o.id === optionId);
//         if (!option) {
//             return;
//         }
//         option.votes.push(socket.data.user);
//         io.to(code).emit("updateState", poll);
//     });
//
//
//     socket.on("disconnect", () => {
//         console.log("user is disconnected", socket.data.user);
//         for (const code in lobbies) {
//             const lobby = lobbies[code];
//             lobby.users = lobby.users.filter((user) => user !== socket.data.user);
//             if (lobby.users.length === 0) {
//                 delete lobbies[code];
//             } else {
//                 io.to(code).emit("updateState", lobby.poll);
//             }
//         }
//     });
// });

// const poll = {
//     question: "What is your current top priority for your meal?",
//     options: [
//         { id: 1, text: "Ambiance", votes:[], },
//         { id: 2, text: "Budget", votes:[], },
//         { id: 3, text: "Cuisine", votes:[], },
//         { id: 4, text: "Distance", votes:[], },
//     ]
// };
//
// io.use(addUser);
//
// function addUser(socket, next) {
//     const user = socket.handshake.auth.token;
//     if (user) {
//         try {
//             socket.data = { ...socket.data, user: user };
//         } catch (err) {}
//     }
//     next();
// }


// socket.on("vote", (optionId) => {
//     poll.options.forEach((option) => {
//         option.votes = option.votes.filter((user) => user !== socket.data.user);
//     });
//     const option = poll.options.find((o) => o.id === optionId);
//     if (!option) {
//         return;
//     }
//     option.votes.push(socket.data.user);
//     io.emit("updateState", poll);
// });
