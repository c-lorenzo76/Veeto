import { FaEarthAmericas } from "react-icons/fa6";
import { CirclePlus, Radio } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const Home = () => {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex justify-end p-8">
                <Select >
                    <SelectTrigger className={"flex border-0 hover:border-0 hover:shadow-md w-fit "}>
                        <SelectValue
                            placeholder={
                            <div className={"flex items-center justify-center ml-1 mr-1 space-x-2 text-xl font-bold"}>
                                <FaEarthAmericas />
                                <span>EN</span>
                            </div>
                        }
                        >
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>English</SelectLabel>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Portuguese">Portuguese</SelectItem>
                            <SelectItem value="Russian">Russian</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-grow mx-auto flex flex-col items-center justify-center">
                <div className="-mt-56">
                    <div className="w-full flex justify-center">
                        <h1 className="text-5xl">
                            Veeto
                        </h1>
                    </div>
                </div>
                <div className="mx-auto mt-10 flex items-center justify-center">
                    <div className="flex flex-col space-y-4">
                        <Link to={"/Create"}>
                            <Button className="w-40 text-white">
                                Create
                                <CirclePlus className="ml-1" />
                            </Button>
                        </Link>
                        <Link to={"/Join"}>
                            <Button className="w-40 text-white">
                                Join
                                <Radio className="ml-1.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
