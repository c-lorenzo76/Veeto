// Create.jsx
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSocket } from "@/SocketContext"
import AvatarSelection from "@/components/AvatarSelection";

export const Create = () => {
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const { socket } = useSocket();


    const avatarSelect = (avatar) => {
        setSelectedAvatar(avatar);
    };

    const handleCreateLobby = () => {
        if (name.trim() === '') return;

        console.log(`Name: ${name}`)

        if(socket){
            socket.auth = { token: name };
            socket.connect();

            socket.emit("createLobby");

            socket.on('lobbyCreated', (code) => {
                navigate(`/Lobby/${code}`);
            });
        } else {
            console.error('Socket not initialized...')
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-screen items-center bg-gray-100">
            <motion.div
                initial={{opacity: 0.0, x: -40}}
                whileInView={{opacity: 1, x: 0}}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
            >
                <Card className="w-full max-w-sm bg-gray-50">
                    <CardHeader>
                        <CardTitle className="text-5xl flex justify-center">
                            create
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your name below to be displayed to others
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2 justify-center items-center">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <motion.div
                                        whileHover={{scale: 1.05}}
                                        transition={{type: "spring", stiffness: 300, damping: 15}}
                                        className="flex items-center justify-center"
                                    >
                                        <div className="flex items-center justify-center">
                                            <Button
                                                className="p-0 w-20 h-20 border bg-transparent hover:bg-muted-foreground/50 rounded-full">
                                                {selectedAvatar ? (
                                                    <img src={selectedAvatar}
                                                         alt="Selected avatar"
                                                         className="w-20 h-20 object-cover rounded-full border-blue-600"/>
                                                ) : (
                                                    <div className="flex items-center justify-center">
                                                        <Plus size={15} className="stroke-black"/>
                                                        <User size={36} className="stroke-black"/>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Select avatar
                                        </DialogTitle>
                                        <DialogDescription>
                                            Choose an avatar to be viewed by others
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogClose>
                                        <AvatarSelection onSelect={avatarSelect} />
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription className="text-center">
                            Select an avatar if you'd like...
                        </CardDescription>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" type="text" placeholder="Neo" onChange={(e) => setName(e.target.value)} required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleCreateLobby}>
                            <ChevronRight/>
                            create
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}