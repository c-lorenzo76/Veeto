import { Button } from "@/components/ui/button";
import { User, Dot, ChevronsLeft, ChevronsRight, Copy } from 'lucide-react';
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/UserContext";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

export const Lobby = () => {
    const [users, setUsers] = useState([]);
    const [lobbyCode, setLobbyCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const { code } = useParams(); // Extract lobby code from the URL parameters
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
        const socket = io('http://localhost:8000', {
            auth: { token: user.name },
        });

        socket.emit('updateLobby', { lobbyCode: code });

        socket.on("lobbyInfo", (lobby) => {
            setLobbyCode(lobby.code);
            setUsers(lobby.users);
            setIsHost(lobby.host === user.name);
        });

        socket.on('updateLobbyUsers', (users) => {
            setUsers(users);
        });

        socket.on("userJoined", (newPlayer) => {
            setUsers((prevState) => [...prevState, newPlayer]);
        });

        socket.on("userDisconnect", (discPlayer) => {
            setUsers((prevState) => prevState.filter((u) => u !== discPlayer));
        });

        return () => {
            socket.disconnect();
        };

    }, [code, user.name]);

    const handleStartGame = () => {
        navigate('/Questions');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <motion.div
                initial={{opacity: 0.0, y: 40}}
                whileInView={{opacity: 1, y: 0}}
                transition={{
                    delay: 0.3,
                    duration: 0.95,
                    ease: "easeInOut",
                }}
            >
                <div className="game-pin w-max mx-auto flex flex-col items-center p-8 bg-gray-100 mt-8">
                    <h1 className="flex items-center justify-center text-2xl font-bold">
                        PIN: {lobbyCode || 'Loading...'}
                        <Copy className={"ml-2"}/>
                    </h1>
                </div>
            </motion.div>
            <div className="sub-nav w-full m-8 grid grid-cols-3 mx-auto items-center">
                <motion.div
                    initial={{opacity: 0.0, x: -40}}
                    whileInView={{opacity: 1, x: 0}}
                    transition={{
                        delay: 0.3,
                        duration: 0.95,
                        ease: "easeInOut",
                    }}
                >
                    <div className="players-joined flex justify-center items-center">
                        <Button>
                            <Dot size={24} className="mr-2 text-red-500"/>
                            <span>{users.length}</span>
                            <User size={24} className="ml-2"/>
                        </Button>
                    </div>
                </motion.div>
                <motion.div
                    initial={{opacity: 0.0, y: -40}}
                    whileInView={{opacity: 1, y: 0}}
                    transition={{
                        delay: 0.3,
                        duration: 0.95,
                        ease: "easeInOut",
                    }}
                >
                    <div className="veto-title flex justify-center items-center">
                        <h1 className="text-5xl font-bold bg-transparent text:shadow-lg">Veeto</h1>
                    </div>
                </motion.div>
                <motion.div
                    initial={{opacity: 0.0, x: 40}}
                    whileInView={{opacity: 1, x: 0}}
                    transition={{
                        delay: 0.3,
                        duration: 0.95,
                        ease: "easeInOut",
                    }}
                >
                    <div className="start-button flex justify-center items-center">
                        {isHost && (
                            <Button
                                className="bg-yellow-500 hover:bg-yellow-300 text-black px-8"
                                onClick={handleStartGame}
                            >
                                Start
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
            <div className="flex border-t-2 justify-center items-center p-5 space-x-2">
                <ChevronsLeft/>
                <h2 className="mt text-2xl text-center font-bold">Joined users</h2>
                <ChevronsRight/>
            </div>
            <div className="joined-users flex-grow flex flex-col">
                    <div className="m-10 mx-auto gap-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {users.map((user, index) => (
                            <div key={index} className="flex items-center justify-center p-4 text-2xl font-semibold">
                                {user}
                            </div>
                        ))}
                    </div>
                </div>
                <Footer/>
        </div>
);
};
