import {useState, useEffect, useMemo} from "react";
import { Layout } from "./Layout.jsx"
import { useParams } from "react-router-dom";
import { Button, Card } from "flowbite-react";
import { useSocket } from "@/SocketContext";
import { Progress } from "@/components/ui/progress";


export const Questions = () => {

    const { socket } = useSocket();
    const { code} = useParams();

    const [users, setUsers] = useState([]);
    const [poll, setPoll] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0); // the index of the current question


    if(!socket){
        console.error('Socket is not initialized..');
        return;
    }

    useEffect(() => {

        // retrieves and sets the poll data
        socket.emit('getPollData', {lobbyCode: code});
        socket.on('setPoll', (poll) => {
            // console.log(`Poll: ${JSON.stringify(poll, null, 2)}`);
            console.log(`Questions: ${JSON.stringify(poll,null, 1)}`);
            setPoll(poll);
        });

        // Gets lobbyUsers
        socket.emit('updateLobby', {lobbyCode: code});
        socket.on("lobbyInfo", (lobby) => {
            console.log('lobby info');
            setUsers(lobby.users)
        });

        socket.on("userDisconnect", (discPlayer) => {
            setUsers((prevState) => prevState.filter((u) => u !== discPlayer));
            console.log(discPlayer, "Disconnected")
        });

        socket.on('Error', (error) => {
            console.log(`There was an error ${error}`);
        });

    }, [code, socket]);

    let totalVotes = useMemo(() => {
        console.log(poll?.questions[currentQuestion].options.reduce((acc, option) => acc + option.votes.length, 0) ?? 0);
        return (
            poll?.questions[currentQuestion].options.reduce((acc, option) => acc + option.votes.length, 0) ?? 0
        )
    }, [poll, currentQuestion]);

    const handleVote = (optionId) => {
        socket.emit("vote", {optionId: optionId, currentQuestion: currentQuestion, lobbyCode: code});
    };


    useEffect(() => {
        if (totalVotes === users.length) {
            if (currentQuestion < poll?.questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                // Future logic to emit to the backend and navigate to results
                console.log("Poll has finished");
            }
        }
    }, [totalVotes, currentQuestion]);

    return (
        <Layout user={socket.auth.token} avatar={socket.auth.avatar}>
            <div className={"w-full bg-gray-100 rounded-xl mx-auto p-4 shadow-md m-2 flex items-center justify-center"}>
                <Progress value={((currentQuestion) / poll?.questions.length) * 100} className={""} />
                <p className={"ml-1 "}>{((currentQuestion) / poll?.questions.length) * 100}%</p>
            </div>
            <div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md "}>
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
                                                {socket.auth.token && !option.votes.includes(socket.auth.token) ? (
                                                    <Button
                                                        className={"bg-teal-500 hover:bg-teal-700 p-2 text-white"}
                                                        onClick={() => handleVote(option.id)}
                                                    >
                                                        Vote
                                                    </Button>
                                                ) : (
                                                    <Button disabled className={"bg-gray-700 text-white p-2"}>
                                                        Voted
                                                    </Button>
                                                )}
                                            </div>
                                            {option.votes.length > 0 && (
                                                <div className={"mt-2 flex gap-2 flex-wrap max-w-[75%]"}>
                                                    {option.votes.map((vote) => (
                                                       <div
                                                           key={vote}
                                                           className={"py-1 px-3 bg-gray-700 rounded-lg flex items-center justify-center shadow text-sm"}
                                                       >
                                                           <div className={"w-2 h-2 bg-green-500 rounded-lg flex items-center justify-center shadow text-sm m-1 "}></div>
                                                           <div className={"text-gray-100"}>{vote}</div>
                                                       </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {/* totalVotes is not updating when I deselect an option */}
                                        <div className={"absolute top-3 right-5 p-2 text-sm font-semibold bg-gray-700 text-white rounded-lg z-10"}>
                                            {option.votes.length} / {users.length}{/* need to change the 0 to be the amount of players in the game*/}
                                        </div>
                                        <div
                                            className={"absolute bottom-0 inset-x-0 bg-gray-200 rounded-md overflow-hidden h-4"}
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

                    </>
                )}
            </div>
        </Layout>
    )

};