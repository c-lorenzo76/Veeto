import { useState, useEffect } from "react";
import { Layout } from "./Layout.jsx"
import { useParams } from "react-router-dom";
import { Button, Card } from "flowbite-react";
import { useSocket } from "@/SocketContext";


export const Questions = () => {

    const { socket } = useSocket();
    const { code} = useParams();

    const [poll, setPoll] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0); // the index of the current question
    const [votes, setVotes] = useState({});


    useEffect(() => {

        if(!socket){
            console.error('Socket is not initialized..');
            return;
        }

        socket.emit('getPollData', {lobbyCode: code});

        socket.on('setPoll', (poll) => {
            console.log(`This is the poll: ${poll}`);
            console.log(`Poll: ${JSON.stringify(poll, null, 2)}`);
            setPoll(poll);
        });

        socket.on('Error', (error) =>{
            console.log(`There was an error ${error}`);
        });

    }, [code, socket]);

    const handleVote = (optionId) => {
        // Update votes state with the selected option
        setVotes(prevVotes => ({
            ...prevVotes,
            [currentQuestion]: optionId
        }));

        // Emit the vote to the server
        socket.emit('vote', {
            lobbyCode: code,
            questionId: poll[currentQuestion].id,
            optionId: optionId,
        });

        // Optionally, move to the next question after voting
        if (currentQuestion < poll.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            console.log('Poll completed');
            // Handle poll completion (e.g., show results or end poll)
        }
    };




    return (
        <Layout user={socket.auth.token} avatar={socket.auth.avatar}>
            <div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>
                {poll && (
                    <>
                        <h1 className={"text-2xl font-bold text-center"}>
                            {poll.questions[currentQuestion].question}
                        </h1>
                        {poll && (
                            <div className={"mt-6 grid sm:grid-cols-1 md:grid-cols-3 gap-4"}>
                                {poll.questions[currentQuestion].options.map(option => (
                                    <Card
                                        key={option.id}
                                        className={"relative transition-all duration-300 min-h-[130px] bg-gray-200 p-2"}
                                    >
                                        <div className={"z-10"}>
                                            <div className={"mb-2"}>
                                                <h2 className={"text-xl font-semibold"}>{option.text}</h2>
                                            </div>
                                            <div className={"absolute bottom-5 right-5"}>
                                                <Button
                                                    className={"bg-teal-500 hover:bg-teal-700 p-2 text-white"}
                                                    onClick={() => handleVote(option.id)}
                                                >
                                                    Vote
                                                </Button>
                                            </div>
                                            {option.votes.length > 0 && (
                                                <div className={"mt-2 flex gap-2 flex-wrap max-w-[75%]"}>
                                                    {option.votes.map((vote) => (
                                                       <div
                                                           key={vote}
                                                           className={"py-1 px-3 bg-gray-700 rounded-lg flex items-center justify-center shadow text-sm"}
                                                       >
                                                           <div className={"w-2 h-2 bg-gray-700 rounded-lg flex items-center justify-center shadow text-sm"}></div>
                                                           <div className={"text-gray-100"}>{vote}</div>
                                                       </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className={"absolute top-5 right-5 p-2 text-sm font-semibold bg-gray-700 text-white rounded-lg z-10"}>
                                            {option.votes.length} / {0}
                                        </div>
                                        <div
                                            className={"absolute bottom-0 inset-x-0 bg-gray-200 rounded-md overflow-hidden h-4"}
                                        >
                                            <div
                                                className={"bg-gradient-to-r from-teal-400 to-purple-500 transition-all duration-300 h-full"}

                                            >

                                            </div>
                                        </div>

                                    </Card>
                                ))}
                            </div>
                        )}

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