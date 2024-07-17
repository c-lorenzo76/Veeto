import {User, Dot} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Footer} from "@/components/Footer";
import { ChevronsLeft,ChevronsRight,Copy } from 'lucide-react';
import {useMemo, useState} from "react";
import {useSocket} from "@/useSocket.jsx";

const users = [
    "Cristian Lorenzo-Pavon",
    "Maria M Pavon",
    "Batman Lorenzo-Pavon",
    "Luna Lorenzo-Pavon"
]

export const Lobby = () => {

    const [lobby, setLobby] = useState(null);

    const names = ["Alice", "Bailey", "Bridget", "Kia", "Sara", "Mia", "Grace", "Heidi", "Eva", "June"];

    const randomUser = useMemo(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        return `${randomName}`;
    }, []);

    const { socket, isConnected } = useSocket({
        endpoint: `http://localhost:8000`,
        token: randomUser,
    });

    // idk what i'm doing but fix this so that the joined users are the ones on different tabs

    // {randomUser && !option.votes.includes(randomUser) ? (
    //     <Button
    //         className="bg-teal-500 hover:bg-teal-700 p-2 text-white"
    //         onClick={() => handleVote(option.id)}
    //     >
    //         Vote
    //     </Button>
    // ) : (
    //     <Button disabled className="bg-gray-700 text-white p-2">
    //         Voted
    //     </Button>
    // )}

    return (
        <div className="flex flex-col min-h-screen">
            <div className="game-pin w-max mx-auto flex flex-col items-center p-8 bg-gray-100 mt-8">
                <h1 className="flex items-center justify-center text-2xl font-bold">
                    PIN: 752 8182
                    <Copy className={"ml-2"} />
                </h1>
            </div>
            <div className="sub-nav w-full m-8 grid grid-cols-3 mx-auto items-center">
                <div className="players-joined flex justify-center items-center">
                    <Button>
                        <Dot size={24} className="mr-2 text-red-500"/>
                        <span>0</span>
                        <User size={24} className="ml-2"/>
                    </Button>
                </div>
                <div className="veto-title flex justify-center items-center">
                    <h1 className="text-5xl font-bold bg-transparent text:shadow-lg">Veeto</h1>
                </div>
                <div className="start-button flex justify-center items-center">
                    <Button className="bg-yellow-500 hover:bg-yellow-300 text-black px-8">
                        Start
                    </Button>
                </div>
            </div>
            <div className="flex border-t-2 justify-center items-center p-5 space-x-2">
                <ChevronsLeft />
                <h2 className="mt text-2xl text-center font-bold">Joined users</h2>
                <ChevronsRight />
            </div>
            {/*An improved version i can do of this is to make a div of a certain width and
            then make the small have grid-cols-3 and md:grids-cols-4. Since the width of the div is smaller it will work fine
            just justify-center and the items-center the names.
            */}
            <div className="joined-users flex-grow flex flex-col">
                <div className="m-10 mx-auto gap-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
                    {users.map((user, index) => (
                        <div key={index} className="flex items-center justify-center p-4 text-2xl font-semibold ">
                            {user}
                        </div>
                    ))}
                </div>
            </div>
            <Footer/>
        </div>
    );
};