import { useState, useEffect, useMemo, useRef } from "react";
import { Layout } from "./Layout.jsx"
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card } from "flowbite-react";
import { useSocket } from "@/SocketContext";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";

function CircularTimer({ timeLeft, duration }) {
    const size = 88;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = duration > 0 ? timeLeft / duration : 0;
    const strokeDashoffset = circumference * (1 - progress);

    const color = timeLeft <= 5
        ? '#ef4444'
        : timeLeft <= 10
            ? '#eab308'
            : '#1a2e1a';

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="#c8dcc8" strokeWidth={strokeWidth}
                />
                {/* Countdown ring */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold tabular-nums" style={{ color }}>
                    {timeLeft}
                </span>
            </div>
        </div>
    );
}


export const Questions = () => {

    const { socket } = useSocket();
    const { code } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    useLeaveGuard({ socket, code });

    const [users, setUsers] = useState([]);
    const [poll, setPoll] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [lockedPlayers, setLockedPlayers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [duration, setDuration] = useState(30);

    const timerIntervalRef = useRef(null);

    const isLocked = lockedPlayers.some(p => p.name === socket?.auth?.token);

    // Request poll data on mount
    useEffect(() => {
        if (!socket) return;
        socket.emit('getPollData', { lobbyCode: code });
        socket.emit('updateLobby', { lobbyCode: code });
    }, [socket, code]);

    // Attach listeners
    useEffect(() => {
        if (!socket) return;

        const handleSetPoll = (data) => setPoll(data);

        const handleLobbyInfo = (lobby) => setUsers(lobby.users);

        const handleNavResults = () => navigate(`/Results/${code}`);

        const handleUserDisconnect = (discPlayer) => {
            setUsers(prev => prev.filter(u => u.name !== discPlayer));
        };

        const handleHostTransferred = ({ newHost }) => {
            toast({
                title: "New host",
                description: `${newHost} is now the host.`,
                duration: 2500,
            });
        };

        const handlePhaseStart = ({ questionIndex, duration: dur, startedAt, lockedPlayers: lp }) => {
            setCurrentQuestion(questionIndex);
            if (lp) setLockedPlayers(lp);
            setDuration(dur);

            // Clear any running timer
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            // Compute remaining time based on server's startedAt
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const initial = Math.max(0, dur - elapsed);
            setTimeLeft(initial);

            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerIntervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const handlePhaseExtend = ({ addedSeconds }) => {
            setTimeLeft(prev => prev + addedSeconds);
        };

        const handleError = (error) => console.error(error);

        socket.on('setPoll', handleSetPoll);
        socket.on('lobbyInfo', handleLobbyInfo);
        socket.on('navResults', handleNavResults);
        socket.on('userDisconnect', handleUserDisconnect);
        socket.on('phase_start', handlePhaseStart);
        socket.on('phase_extend', handlePhaseExtend);
        socket.on('hostTransferred', handleHostTransferred);
        socket.on('Error', handleError);

        return () => {
            socket.off('setPoll', handleSetPoll);
            socket.off('lobbyInfo', handleLobbyInfo);
            socket.off('navResults', handleNavResults);
            socket.off('userDisconnect', handleUserDisconnect);
            socket.off('phase_start', handlePhaseStart);
            socket.off('phase_extend', handlePhaseExtend);
            socket.off('hostTransferred', handleHostTransferred);
            socket.off('Error', handleError);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [socket, code, navigate, toast]);

    // Total votes on current question
    const totalVotes = useMemo(() => {
        return poll?.questions[currentQuestion].options.reduce(
            (acc, option) => acc + option.votes.length, 0
        ) ?? 0;
    }, [poll, currentQuestion]);

    const handleVote = (optionId) => {
        socket.emit("vote", { optionId, lobbyCode: code });
    };

    return (
        <Layout user={socket?.auth?.token} avatar={socket?.auth?.avatar}>
            <div className={"w-full lg:w-[80%] rounded-2xl mx-auto p-4 pt-6 mb-6"}>
                <Field className="w-full">
                    <FieldLabel htmlFor="progress-poll" className="text-[#2d6a2d]">
                        {/* <span className="text-white">Poll Completion</span> */}
                        <span className="ml-auto text-[#2d6a2d]">
                            {currentQuestion} of {poll?.questions.length || 0}
                        </span>
                    </FieldLabel>
                    <Progress
                        value={((currentQuestion) / (poll?.questions.length || 1)) * 100}
                        id="progress-poll"
                        className="bg-[#c8dcc8] [&>div]:bg-[#2d6a2d]"
                    />
                </Field>
            </div>

            <div className={"w-full lg:w-[80%] bg-[#f0f7f0] rounded-xl mx-auto p-8 shadow-sm"}>
                {poll && (
                    <>
                        {/* Timer + question */}

                        
                        <div className="flex items-center gap-6 mb-6">
                            <CircularTimer timeLeft={timeLeft} duration={duration} />
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-[#5a7a5a] uppercase mb-1">
                                    Question {currentQuestion + 1} of {poll?.questions.length || 0}
                                </p>
                                <h1 className={"text-2xl font-bold text-[#1a2e1a]"}>
                                    {poll.questions[currentQuestion].question}
                                </h1>
                            </div>
                        </div>

                        {!isLocked && (
                            <p className="text-center text-sm text-[#5a7a5a] mt-2">
                                👀 You are watching — voting is locked to original players
                            </p>
                        )}

                        <div className={"mt-6 grid sm:grid-cols-1 md:grid-cols-3 gap-4"}>
                            {poll.questions[currentQuestion].options.map(option => (
                                <Card
                                    key={option.id}
                                    className={"relative transition-all duration-300 min-h-[130px] bg-white border border-[#c8dcc8] p-2"}
                                >
                                    <div className={"z-10"}>
                                        <div className={"mb-2"}>
                                            <h2 className={"text-xl font-semibold text-[#1a2e1a]"}>{option.text}</h2>
                                        </div>

                                        {/* Vote button — only for locked-in players */}
                                        {isLocked && (
                                            <div className={"absolute bottom-5 right-5"}>
                                                {!option.votes.includes(socket?.auth?.token) ? (
                                                    <Button
                                                        className={"bg-[#2d6a2d] hover:bg-[#266226] text-white md:p-2"}
                                                        onClick={() => handleVote(option.id)}
                                                    >
                                                        Vote
                                                    </Button>
                                                ) : (
                                                    <Button disabled className={"bg-[#c8dcc8] text-[#1a2e1a] md:p-2"}>
                                                        Voted
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {option.votes.length > 0 && (
                                            <div className={"mt-2 flex gap-2 flex-wrap max-w-[75%]"}>
                                                {option.votes.map((vote) => (
                                                    <div
                                                        key={vote}
                                                        className={"py-1 px-3 bg-[#1a2e1a] rounded-lg flex items-center justify-center shadow text-sm"}
                                                    >
                                                        <div className={"w-2 h-2 bg-[#2d6a2d] rounded-lg flex items-center justify-center shadow text-sm m-1"}></div>
                                                        <div className={"text-gray-100"}>{vote}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Vote count badge */}
                                    <div className={"absolute top-3 right-5 p-2 text-sm font-semibold bg-[#1a2e1a] text-white rounded-lg z-10"}>
                                        {option.votes.length} / {lockedPlayers.length || users.length}
                                    </div>

                                    {/* Vote bar */}
                                    <div className={"absolute bottom-0 inset-x-0 bg-[#c8dcc8] rounded-md overflow-hidden h-4"}>
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-300 h-full"
                                            style={{
                                                width: `${totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};
