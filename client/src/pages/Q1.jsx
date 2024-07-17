import { useState, useMemo, useEffect } from "react";
import { Layout } from "./Layout.jsx"
import { Button, Card } from "flowbite-react";
import { useSocket } from "../useSocket.jsx";
import {Footer} from "@/components/Footer.jsx";

export const Q1 = () => {
    const [poll, setPoll] = useState(null);

    const joined = [];
    const names = ["Alice", "Bailey", "Bridget", "Kia", "Sara", "Mia", "Grace", "Heidi", "Eva", "June"];

    const randomUser = useMemo(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        return `${randomName}`;
    }, []);

    const { socket, isConnected } = useSocket({
        endpoint: `http://localhost:8000`,
        token: randomUser,
    });

    const totalVotes = useMemo(() => {
        return (
            poll?.options.reduce((acc, option) => acc + option.votes.length, 0) ?? 0
        );
    }, [poll]);

    socket.on("updateState", (newState) => {
        setPoll(newState);
    });

    useEffect(() => {
        socket.emit("updateState");
    }, []);

    function handleVote(optionId) {
        socket.emit("vote", optionId);
    }

    return (
        <Layout  user={randomUser}>
            <div className="w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md">
                <h1 className="text-2xl font-bold text-center">
                    {poll?.question ?? "Loading..."}
                </h1>
                {poll && (
                    <div className="mt-6 grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                        {poll.options.map((option) => (
                            <Card
                                key={option.id}
                                className="relative transition-all duration-300 min-h-[130px] bg-gray-200 p-2"
                            >
                                <div className="z-10">
                                    <div className="mb-2">
                                        <h2 className="text-xl font-semibold">{option.text}</h2>
                                        <p className="text-gray-700">{option.description}</p>
                                    </div>
                                    <div className="absolute bottom-5 right-5">
                                        {randomUser && !option.votes.includes(randomUser) ? (
                                            <Button
                                                className="bg-teal-500 hover:bg-teal-700 p-2 text-white"
                                                onClick={() => handleVote(option.id)}
                                            >
                                                Vote
                                            </Button>
                                        ) : (
                                            <Button disabled className="bg-gray-700 text-white p-2">
                                                Voted
                                            </Button>
                                        )}
                                    </div>
                                    {option.votes.length > 0 && (
                                        <div className="mt-2 flex gap-2 flex-wrap max-w-[75%]">
                                            {option.votes.map((vote) => (
                                                <div
                                                    key={vote}
                                                    className="py-1 px-3 bg-gray-700 rounded-lg flex items-center justify-center shadow text-sm"
                                                >
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                    <div className="text-gray-100">{vote}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-5 right-5 p-2 text-sm font-semibold bg-gray-700 text-white rounded-lg z-10">
                                    {option.votes.length} / {totalVotes}
                                </div>
                                <div
                                    className="absolute bottom-0 inset-x-0 bg-gray-200 rounded-md overflow-hidden h-4"
                                >
                                    <div
                                        className="bg-gradient-to-r from-teal-400 to-purple-500 transition-all duration-300 h-full"
                                        style={{
                                            width: `${
                                                totalVotes > 0
                                                    ? (option.votes.length / totalVotes) * 100
                                                    : 0
                                            }%`,
                                        }}
                                    ></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );

}