import { useState, useEffect, useMemo } from "react";
import { Layout } from "./Layout.jsx"
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useUser } from "@/UserContext.jsx";
import { Button, Card } from "flowbite-react";
import { useSocket } from "@/useSocket.jsx";


export const Questions = () => {

    const [poll, setPoll] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0); // the index of the current question
    const {user} = useUser();
    const {code} = useParams();
    const [votes, setVotes] = useState({});


    useEffect(() => {
        const socket = io('http://localhost:8000', {
            auth: {token: user.name},
        });

        console.log("Connecting to socket with code:", code);

        socket.emit('getPollData', {lobbyCode: code});

        socket.on('setPoll', (poll) => {
            console.log(`This is the poll: ${poll}`);
            setPoll(poll); // Directly setting the poll data
        });

        socket.emit('test', {lobbyCode: code});

        socket.on('getHost', (host) =>{
            console.log(`host: ${host}`);
        })

        socket.on('Error', (error) =>{
            console.log(`There was an error ${error}`);
        });

        return () => {
            socket.disconnect(); // Clean up the socket connection
        };

    }, [code, user.name]);




    return (
        <Layout>
            <div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>
                {poll && (
                    <>
                        <h1 className={"text-2xl font-bold text-center"}>
                            {poll[currentQuestion].question}
                        </h1>
                        <div className="mt-4">
                            {poll[currentQuestion].options.map(option => (
                                <Card key={option.id} className="mb-4">
                                    <h5>{option.text}</h5>
                                    <Button onClick={() => handleVote(option.id)}>Vote</Button>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )

};

// <div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>
//     <h1 className={"text-2xl font-bold text-center"}>
//         What is the top priority?
//     </h1>
//     <div className={"mt-6 grid sm:grid-cols-1 md:grid-cols-3 gap-4"}>
//         <Card className={"relative transition-all duration-300 min-h-[130px] bg-gray-200 p-2"}>
//             <div className={"z-10"}>
//                 <div className={"mb-2"}>
//                     <h2 className={"text-xl font-semibold"}>Text</h2>
//                     <p>Description</p>
//                 </div>
//                 <div className={"absolute bottom-5 right-5"}>
//                     <Button className={"bg-teal-500 hover:bg-teal-700 p-2 text-white"}>
//                         Vote
//                     </Button>
//                 </div>
//                 <div className={"mt-2 flex gap-2 flex-wrap max-w-[75%]"}>
//                     <div className={"py-1 px-3 bg-gray-700 rounded-lg flex items-center justify-center shadow text-sm"}>
//                         <div className={"w-2 h-2 bg-green-500 rounded-full mr-2"}></div>
//                         <div className={"text-gray-100"}>Vote</div>
//                     </div>
//                 </div>
//             </div>
//             <div className={"absolute top-5 right-5 p-2 text-sm font-semibold bg-gray-700 text-white rounded-lg z-10"}>
//                 total votes
//             </div>
//         </Card>
//     </div>
// </div>