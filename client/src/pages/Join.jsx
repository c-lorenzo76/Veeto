import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.jsx";
import { Plus, User, Merge } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import AvatarSelection from "@/components/AvatarSelection";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/SocketContext";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";


export const Join = () => {
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const navigate = useNavigate();
    const { socket, connectSocket } = useSocket();


    const avatarSelect = (avatar) => {
        setSelectedAvatar(avatar);
    };

    const handleJoin = () => {
        console.log("name: ", name);
        console.log("lobby-code: ", pin);

        if (name && pin) {
            connectSocket(name, selectedAvatar);
            socket.emit("joinLobby", { lobbyCode: pin });

            socket.on('lobbyJoined', () => {
               navigate(`/Lobby/${pin}`);
            });
        }
    };

    return (
        <div className="flex flex-col justify-center min-h-screen items-center bg-gray-100">
            <motion.div
                initial={{ opacity: 0.0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
            >
                <Card className="w-full max-w-sm bg-gray-50">
                    <CardHeader>
                        <CardTitle className="text-5xl flex justify-center">
                            Join
                        </CardTitle>
                        <CardDescription className="text-center text-md">
                            Enter your name below to be displayed to others and the pin provided by the host
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className={"grid gap-2 justify-center items-center"}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                        className="flex items-center justify-center"
                                    >
                                        <div className={"flex items-center justify-center "}>
                                            <Button
                                                className={"p-0 w-20 h-20 border bg-transparent hover:bg-muted-foreground/50 rounded-full"}>
                                                {selectedAvatar ? (
                                                    <img src={selectedAvatar}
                                                         alt={"Selected avatar"}
                                                         className={"w-20 h-20 object-cover rounded-full border-blue-600"} />
                                                ) : (
                                                    <div className={"flex items-center justify-center"}>
                                                        <Plus size={15} className={"stroke-black"} />
                                                        <User size={36} className={"stroke-black"} />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
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
                                        <AvatarSelection onSelect={avatarSelect} />
                                    </DialogClose>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription className={"text-center"}>
                            Select an avatar if you'd like...
                        </CardDescription>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Neo"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pin">Pin</Label>
                            <div className="flex items-center justify-center mx-auto ">
                                <InputOTP
                                    id="pin"
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                    value={pin}
                                    onChange={(e) => setPin(e)}
                                >
                                    <InputOTPGroup className="bg-white">
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup className="bg-white">
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleJoin}>
                            <Merge className={"mr-0.5"} />
                            Join host
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};