import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom";
import {useState} from "react";
import { ChevronRight,User, Plus } from 'lucide-react';

import alien from '../assets/avatar-pfp/Alien.svg';
import batman from '../assets/avatar-pfp/Batman.svg';
import chickenLeg from '../assets/avatar-pfp/ChickenLeg.svg';
import deadPool from '../assets/avatar-pfp/DeadPool.svg';
import hotdog from '../assets/avatar-pfp/hotdog.svg';
import ironMan from '../assets/avatar-pfp/IronMan.svg';
import sailorCat from '../assets/avatar-pfp/Sailor-Cat.svg';
import wolverine from "../assets/avatar-pfp/Wolverine.svg";

const avatars = {
    Alien: alien,
    Batman: batman,
    ChickenLeg: chickenLeg,
    DeadPool: deadPool,
    hotdog: hotdog,
    IronMan: ironMan,
    SailorCat: sailorCat,
    Wolverine: wolverine,
};



export const Create = () => {
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const avatarSelect = (avatar) => {
        setSelectedAvatar(avatar);
    };


    return (
        <div className="flex flex-col justify-center min-h-screen items-center bg-gray-100">
            <Card className="w-full max-w-sm bg-gray-50">
                <CardHeader>
                    <CardTitle className="text-5xl flex justify-center  ">
                        create
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your name below to be displayed to others
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className={"grid gap-2 justify-center items-center"}>
                        <Dialog>
                            <DialogTrigger asChild>
                                <div className={"flex items-center justify-center "}>
                                    <Button className={"p-0 w-20 h-20 border bg-transparent hover:bg-muted-foreground/50 rounded-full"}>
                                        {selectedAvatar ? (
                                            <img src={selectedAvatar}
                                                 alt={"Selected avatar"}
                                                 className={"w-20 h-20 object-cover rounded-full border-blue-600 "} />
                                        ):(
                                            <div className={"flex items-center justify-center"}>
                                                <Plus size={15} className={"stroke-black"}/>
                                                <User size={36} className={"stroke-black"} />
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent className={"sm:max-w-[425px]"}>
                                <DialogHeader>
                                    <DialogTitle>
                                        Select avatar
                                    </DialogTitle>
                                    <DialogDescription>
                                        Choose an avatar to be viewed by others
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogClose>
                                    <div className={"grid grid-cols-4 gap-8 gap-x-14 py-4  mx-auto"}>
                                        {Object.entries(avatars).map(([name, src]) => (
                                            <img
                                                key={name}
                                                alt={name}
                                                src={src}
                                                className={`rounded-full h-10 w-10 cursor-pointer`}
                                                onClick={() => avatarSelect(src)}
                                            />
                                        ))}
                                    </div>
                                </DialogClose>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription className={"text-center"}>
                        Select an avatar if you'd like...
                    </CardDescription>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Name</Label>
                        <Input id="name" type="name" placeholder="Neo" required/>
                    </div>
                </CardContent>
                <Link to="/Lobby">
                    <CardFooter>
                        <Button className="w-full">
                            <ChevronRight />
                            create
                        </Button>
                    </CardFooter>
                </Link>
            </Card>
        </div>
    )
}
