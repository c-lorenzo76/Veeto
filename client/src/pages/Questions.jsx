import {useState, useMemo, useEffect} from "react";
import {Layout} from "./Layout.jsx"
import {Button, Card} from "flowbite-react";
import {useSocket} from "@/useSocket.jsx";
import {useUser} from "@/UserContext.jsx";
import {io} from "socket.io-client";
import {useParams} from "react-router-dom";


export const Questions = () => {

    const [poll, setPoll] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0); // the index of the current question
    const {user} = useUser();
    const [votes, setVotes] = useState({});
    const {code} = useParams();


    useEffect(() => {
        const socket = io('http://localhost:8000', {
            auth: {token: user.name},
        });

        socket.emit('getPollData', {lobbyCode: code});

        socket.on('setPoll', (questions) => {
            console.log(questions);
            setPoll(questions);
        });


        return () => {
            socket.disconnect();
        };

    }, [code]);




    return (
        <Layout>
            <div className={"w-full bg-gray-100 rounded-xl mx-auto p-8 shadow-md"}>
                <h1 className={"text-2xl font-bold text-center"}>


                </h1>
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