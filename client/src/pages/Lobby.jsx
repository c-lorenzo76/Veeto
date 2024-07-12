import { User, Dot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export const Lobby = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="game-pin w-max mx-auto flex flex-col items-center p-8 bg-gray-100 mt-8">
                <h1 className="text-2xl font-bold">
                    PIN: 752 8182
                </h1>
            </div>
            <div className="sub-nav w-full m-8 grid grid-cols-3 mx-auto items-center">
                <div className="players-joined flex justify-center items-center">
                    <Dot size={24} className="mr-2 text-red-500" />
                    <span>1</span>
                    <User size={24} className="ml-2" />
                </div>
                <div className="veto-title flex justify-center items-center">
                    <h1 className="text-5xl font-bold bg-transparent text:shadow-lg">Veeto</h1>
                </div>
                <div className="start-button flex justify-center items-center">
                    <Button className="bg-yellow-500 text-black">
                        Start
                    </Button>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <h2 className="text-2xl text-center font-bold mb-10">Joined users</h2>
            </div>
            {/*An improved version i can do of this is to make a div of a certain width and
            then make the small have grid-cols-3 and md:grids-cols-4. Since the width of the div is smaller it will work fine
            just justify-center and the items-center the names.
            */}
            <div className="joined-users flex-grow flex flex-col items-center justify-center">
                <ul className="flex flex-wrap gap-6 sm:gap-y-20 gap-y-32 justify-center w-[90%] md:w-[60%] rounded-lg font-semibold text-lg">
                    <li className="flex items-center">
                        <span>Natalie Perez</span>
                    </li>
                    <li className="flex items-center">
                        <span>Cristian Lorenzo-Pavon</span>
                    </li>
                    <li className="flex items-center">
                        <span>Batman Lorenzo-Pavon</span>
                    </li>
                    <li className="flex items-center">
                        <span>Luna Lorenzo-Pavon</span>
                    </li>
                    <li className="flex items-center">
                        <span>Natalie Perez</span>
                    </li>
                    <li className="flex items-center">
                        <span>Cristian Lorenzo-Pavon</span>
                    </li>
                    <li className="flex items-center">
                        <span>Batman Lorenzo-Pavon</span>
                    </li>
                    <li className="flex items-center">
                        <span>Luna Lorenzo-Pavon</span>
                    </li>
                </ul>
            </div>
            <Footer />
        </div>
    );
};
