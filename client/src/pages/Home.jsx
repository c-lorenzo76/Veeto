import { Button } from "@/components/ui/button.jsx";
import { FaEarthAmericas } from "react-icons/fa6";
import { CirclePlus } from 'lucide-react';
import { Radio } from 'lucide-react';
import { Link } from 'react-router-dom'

export const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="border flex justify-end p-8">
                <Button className="relative text-xl bg-transparent hover:bg-transparent hover:shadow-md text-black">
                    <FaEarthAmericas className="mr-1" />
                    EN
                </Button>
            </div>
            <div className="border-8 min-h flex-grow flex flex-col items-center justify-center">
                <div className="border -mt-56">
                    <div className="w-full flex justify-center">
                        <h1 className="text-5xl">
                            Veto
                        </h1>
                    </div>
                </div>
                <div className="mx-auto flex items-center justify-center">
                    <div className="flex flex-col space-y-2">
                        <Link to={"/Create"}>
                            <Button className="w-40 text-white">
                                Create
                                <CirclePlus className="ml-1" />
                            </Button>
                        </Link>
                        <Button className="w-40 text-white">
                            Join
                            <Radio className="ml-1.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
