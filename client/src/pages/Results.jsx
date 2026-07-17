import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/SocketContext";
import { Layout } from "./Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Globe, ExternalLink, ChevronDown, ChevronUp, Timer, Trophy, LogOut } from "lucide-react";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { useStrings } from "@/context/LanguageContext";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Mirrors the server's distanceToRadius ladder in server/index.js so the
// broadened-search banner can show a human-readable label for the radius
// actually used.
function radiusToLabel(radiusMeters, t) {
    const radiusToLabelMap = {
        1610: t.results.radiusWalking,
        8047: t.results.radiusShortDrive,
        24145: t.results.radiusModerateDrive,
        50000: t.results.radiusLongDrive,
    };
    if (!radiusMeters) return null;
    if (radiusToLabelMap[radiusMeters]) return radiusToLabelMap[radiusMeters];
    const miles = (radiusMeters / 1609.34).toFixed(1);
    return `~${miles} miles`;
}

function MapController({ selectedPlaceId, places }) {
    const map = useMap();
    useEffect(() => {
        if (selectedPlaceId) {
            const place = places.find(p => p.place_id === selectedPlaceId);
            if (place?.geometry?.location) {
                map.flyTo([place.geometry.location.lat, place.geometry.location.lng], 15, { duration: 0.8 });
            }
        } else if (places.length > 0 && places[0].geometry?.location) {
            map.flyTo([places[0].geometry.location.lat, places[0].geometry.location.lng], 12, { duration: 0.8 });
        }
    }, [selectedPlaceId]);
    return null;
}


function RemoteCursor({ user, avatar, x, y }) {
    const motionX = useMotionValue(x);
    const motionY = useMotionValue(y);
    const springX = useSpring(motionX, { stiffness: 1000, damping: 50, mass: 0.1 });
    const springY = useSpring(motionY, { stiffness: 1000, damping: 50, mass: 0.1 });

    useEffect(() => {
        motionX.set(x);
        motionY.set(y);
    }, [x, y]);

    return (
        <motion.div
            className="pointer-events-none absolute z-50"
            style={{ left: springX, top: springY }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <svg
                stroke="currentColor" fill="currentColor" strokeWidth="1"
                viewBox="0 0 16 16"
                className="h-5 w-5 -rotate-[70deg] text-[#2d6a2d] drop-shadow"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
            </svg>
            <div className="ml-4 -mt-1 flex items-center gap-1.5 bg-[#1a2e1a] text-white text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shadow">
                {avatar && <img src={avatar} alt="" className="w-4 h-4 rounded-full object-cover" />}
                <span>{user}</span>
            </div>
        </motion.div>
    );
}

export const Results = () => {
    const { socket } = useSocket();
    const { code } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const t = useStrings();

    useLeaveGuard({ socket, code });

    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
    const [placeDetailsMap, setPlaceDetailsMap] = useState({});
    const [loadingDetailId, setLoadingDetailId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Phase / voting state
    const [lockedPlayers, setLockedPlayers] = useState([]);
    const [myVote, setMyVote] = useState(null);
    const [voteCount, setVoteCount] = useState({ voted: 0, total: 0 });
    const [timeLeft, setTimeLeft] = useState(90);
    const [phase, setPhase] = useState('voting'); // 'voting' | 'winner'
    const [winnerPlace, setWinnerPlace] = useState(null);
    const [winnerDetails, setWinnerDetails] = useState(null);
    const [searchBroadened, setSearchBroadened] = useState(false);
    const [radiusUsed, setRadiusUsed] = useState(null);

    const [remoteCursors, setRemoteCursors] = useState({}); // { username: { x, y, avatar } }

    const loadingDetailRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const listPanelRef = useRef(null);
    const throttleRef = useRef(null);

    const isLocked = lockedPlayers.some(p => p.name === socket?.auth?.token);

    const youAreHereIcon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center">
            <div style="width:14px;height:14px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
            <span style="font-size:10px;font-weight:700;color:#ef4444;white-space:nowrap;margin-top:3px;text-shadow:0 1px 2px white">${t.results.youAreHere}</span>
        </div>`,
        iconSize: [80, 36],
        iconAnchor: [40, 8],
    });

    useEffect(() => {
        if (!socket) return;

        const handleGetPlaces = ({ places, coords, lockedPlayers: lp, radiusUsed: radius, searchBroadened: broadened }) => {
            setPlaces(places);
            setLoading(false);
            setRadiusUsed(radius ?? null);
            setSearchBroadened(Boolean(broadened));
            if (lp) setLockedPlayers(lp);
            if (coords) {
                const [lat, lng] = coords.split(',').map(Number);
                setUserLocation([lat, lng]);
            }
            if (places.length > 0) {
                const first = places[0];
                setSelectedPlaceId(first.place_id);
                loadingDetailRef.current = first.place_id;
                setLoadingDetailId(first.place_id);
                socket.emit('getPlaceDetails', { placeId: first.place_id });
            }
        };

        const handlePhaseStart = ({ phase: ph, duration, startedAt, lockedPlayers: lp }) => {
            if (ph !== 'finalVote') return;
            if (lp) setLockedPlayers(lp);

            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            // Clamp elapsed in both directions to guard against clock skew
            // between client and server.
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const initial = duration - Math.max(0, Math.min(duration, elapsed));
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

        const handleVoteCount = ({ voted, total }) => {
            setVoteCount({ voted, total });
        };

        const handleWinner = ({ place }) => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setWinnerPlace(place);
            setPhase('winner');
            // Fetch full details for winner
            if (place?.place_id) {
                socket.emit('getPlaceDetails', { placeId: place.place_id });
                loadingDetailRef.current = place.place_id;
            }
        };

        // Override placeDetails to also capture winner details
        const handlePlaceDetailsWithWinner = (details) => {
            const id = loadingDetailRef.current;
            if (id) {
                setPlaceDetailsMap(prev => ({ ...prev, [id]: details }));
                setWinnerDetails(details);
                setLoadingDetailId(null);
                loadingDetailRef.current = null;
            }
        };

        socket.on('getPlaces', handleGetPlaces);
        socket.on('placeDetails', handlePlaceDetailsWithWinner);
        socket.on('phase_start', handlePhaseStart);
        socket.on('phase_extend', handlePhaseExtend);
        socket.on('restaurantVoteCount', handleVoteCount);
        const handleHostLeft = () => {
            socket.disconnect();
            navigate('/', { state: { hostLeft: true } });
        };

        const handleRemoteCursorMove = ({ user, avatar, x, y }) => {
            setRemoteCursors(prev => ({ ...prev, [user]: { x, y, avatar } }));
        };

        const handleRemoteCursorLeave = ({ user }) => {
            setRemoteCursors(prev => {
                const next = { ...prev };
                delete next[user];
                return next;
            });
        };

        const handleHostTransferred = ({ newHost }) => {
            toast({
                title: t.results.newHostTitle,
                description: t.results.newHostDescription(newHost),
                duration: 2500,
            });
        };

        socket.on('winner', handleWinner);
        socket.on('hostLeft', handleHostLeft);
        socket.on('hostTransferred', handleHostTransferred);
        socket.on('cursorMove', handleRemoteCursorMove);
        socket.on('cursorLeave', handleRemoteCursorLeave);

        return () => {
            socket.off('getPlaces', handleGetPlaces);
            socket.off('placeDetails', handlePlaceDetailsWithWinner);
            socket.off('phase_start', handlePhaseStart);
            socket.off('phase_extend', handlePhaseExtend);
            socket.off('restaurantVoteCount', handleVoteCount);
            socket.off('winner', handleWinner);
            socket.off('hostLeft', handleHostLeft);
            socket.off('hostTransferred', handleHostTransferred);
            socket.off('cursorMove', handleRemoteCursorMove);
            socket.off('cursorLeave', handleRemoteCursorLeave);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [code, socket, toast, t]);

    const handleSelectPlace = (place) => {
        if (selectedPlaceId === place.place_id) {
            setSelectedPlaceId(null);
            return;
        }
        setSelectedPlaceId(place.place_id);
        if (!placeDetailsMap[place.place_id]) {
            loadingDetailRef.current = place.place_id;
            setLoadingDetailId(place.place_id);
            socket.emit('getPlaceDetails', { placeId: place.place_id });
        }
    };

    const handlePanelMouseMove = (e) => {
        if (throttleRef.current) return;
        throttleRef.current = setTimeout(() => { throttleRef.current = null; }, 16);

        const rect = listPanelRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        socket.emit('cursorMove', { lobbyCode: code, x, y });
    };

    const handlePanelMouseLeave = () => {
        socket.emit('cursorLeave', { lobbyCode: code });
    };

    const handleVoteRestaurant = (placeId) => {
        if (myVote || !isLocked) return;
        setMyVote(placeId);
        socket.emit('voteRestaurant', { lobbyCode: code, placeId });
    };

    const handleExit = () => {
        socket?.disconnect();
        navigate('/');
    };

    const mapCenter = places.length > 0 && places[0].geometry?.location
        ? [places[0].geometry.location.lat, places[0].geometry.location.lng]
        : [35.85, -79.56];

    const timerColor = timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-yellow-500' : 'text-[#1a2e1a]';

    if (phase === 'winner' && winnerPlace) {
        const details = winnerDetails || placeDetailsMap[winnerPlace.place_id];
        return (
            <Layout user={socket?.auth?.token} avatar={socket?.auth?.avatar}>
                <div className="bg-[#e8f0e8] px-6 pt-6 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-400" />
                        <h1 className="text-3xl font-bold text-[#1a2e1a]">{t.results.goingTo}</h1>
                        <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-400" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-lg">
                        {details?.photos?.[0]?.photo_reference && (
                            <img
                                src={`${API_BASE_URL}/api/place-photo?ref=${details.photos[0].photo_reference}`}
                                alt={winnerPlace.name}
                                className="w-full h-52 object-cover"
                            />
                        )}
                        <div className="p-6 space-y-3">
                            <h2 className="text-2xl font-bold text-[#1a2e1a]">{winnerPlace.name}</h2>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-lg">{winnerPlace.rating}</span>
                                <span className="text-yellow-500 text-lg">
                                    {'★'.repeat(Math.round(winnerPlace.rating))}
                                    {'☆'.repeat(5 - Math.round(winnerPlace.rating))}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    ({winnerPlace.user_ratings_total?.toLocaleString()})
                                </span>
                                {winnerPlace.price_level && (
                                    <span className="ml-auto text-muted-foreground font-medium">
                                        {'$'.repeat(winnerPlace.price_level)}
                                    </span>
                                )}
                            </div>

                            {details?.formatted_address && (
                                <div className="flex gap-2 items-start">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">{details.formatted_address}</span>
                                </div>
                            )}
                            {details?.opening_hours && (
                                <div className="flex gap-2 items-center">
                                    <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    <span className={`text-sm font-semibold ${details.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                        {details.opening_hours.open_now ? t.results.openNow : t.results.closed}
                                    </span>
                                </div>
                            )}
                            {details?.formatted_phone_number && (
                                <div className="flex gap-2 items-center">
                                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">{details.formatted_phone_number}</span>
                                </div>
                            )}
                            {details?.website && (
                                <div className="flex gap-2 items-center">
                                    <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    <a href={details.website} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-[#2d6a2d] hover:underline truncate">
                                        {details.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                    </a>
                                </div>
                            )}
                            {details?.url && (
                                <a href={details.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-[#2d6a2d] hover:underline pt-1">
                                    <ExternalLink className="w-4 h-4" />
                                    {t.results.viewOnGoogleMaps}
                                </a>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleExit}
                        className="mt-6 mb-6 bg-[#1a2e1a] hover:bg-[#2d6a2d] text-white"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t.results.exit}
                    </Button>
                </div>
            </Layout>
        );
    }

    // ── Voting screen ─────────────────────────────────────────
    return (
        <Layout user={socket.auth.token} avatar={socket.auth.avatar}>
            <div className="bg-[#e8f0e8] px-6 pt-4 min-h-screen flex flex-col">

                {/* Timer + vote count bar */}
                <div className="flex w-[90%] lg:w-[80%] mx-auto items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                        <Timer className={`w-5 h-5 ${timerColor}`} />
                        <span className={`text-xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
                    </div>
                    <div className="text-sm font-semibold text-[#1a2e1a] bg-white px-4 py-1.5 rounded-full shadow-sm">
                        {voteCount.voted} / {voteCount.total || lockedPlayers.length} {t.results.votedSuffix}
                    </div>
                    {!isLocked && (
                        <span className="text-sm text-[#5a7a5a] italic">{t.results.watching}</span>
                    )}
                </div>

                {searchBroadened && (
                    <div role="status" className="w-[90%] lg:w-[80%] mx-auto mb-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                            {t.results.broadenedSearchText}
                            <span className="hidden sm:inline">
                                {radiusUsed ? t.results.broadenedSearchRadius(radiusToLabel(radiusUsed, t)) : ''}
                            </span>
                            .
                        </span>
                    </div>
                )}

                <div className="flex w-[90%] lg:w-[80%] mx-auto gap-4 pb-6 flex-1 min-h-0">

                    {/* Left: restaurant list with live cursors */}
                    <FollowerPointerCard
                        className="w-[40%] rounded-xl overflow-hidden shadow-sm"
                        title={
                            <div className="flex items-center gap-1.5">
                                {socket?.auth?.avatar && (
                                    <img src={socket.auth.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                )}
                                <span>{socket?.auth?.token}</span>
                            </div>
                        }
                    >
                    <div
                        ref={listPanelRef}
                        className="relative h-full overflow-y-auto bg-white"
                        onMouseMove={handlePanelMouseMove}
                        onMouseLeave={handlePanelMouseLeave}
                    >
                        {/* Remote cursors */}
                        <AnimatePresence>
                            {Object.entries(remoteCursors).map(([user, { x, y, avatar }]) => (
                                <RemoteCursor key={user} user={user} avatar={avatar} x={x} y={y} />
                            ))}
                        </AnimatePresence>
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3">
                                        <Skeleton className="h-4 flex-1" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {places.map((place) => {
                                    const isExpanded = selectedPlaceId === place.place_id;
                                    const details = placeDetailsMap[place.place_id];
                                    const isLoadingDetails = loadingDetailId === place.place_id;
                                    const hasVotedThis = myVote === place.place_id;

                                    return (
                                        <div key={place.place_id}>
                                            <div
                                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[#e8f0e8] transition-colors ${hasVotedThis ? 'bg-[#e8f0e8]' : ''}`}
                                                onClick={() => handleSelectPlace(place)}
                                            >
                                                <span className="font-medium flex-1 truncate">{place.name}</span>
                                                {hasVotedThis && (
                                                    <span className="text-xs text-[#2d6a2d] font-semibold shrink-0">{t.results.votedCheck}</span>
                                                )}
                                                {isExpanded
                                                    ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                    : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                }
                                            </div>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 bg-white space-y-3">
                                                    {isLoadingDetails ? (
                                                        <div className="space-y-2 pt-2">
                                                            <Skeleton className="w-full h-36 rounded-lg" />
                                                            <Skeleton className="h-4 w-32" />
                                                            <Skeleton className="h-4 w-full" />
                                                            <Skeleton className="h-4 w-40" />
                                                        </div>
                                                    ) : details && (
                                                        <>
                                                            {details.photos?.[0]?.photo_reference && (
                                                                <img
                                                                    src={`${API_BASE_URL}/api/place-photo?ref=${details.photos[0].photo_reference}`}
                                                                    alt={place.name}
                                                                    className="w-full h-36 object-cover rounded-lg"
                                                                />
                                                            )}
                                                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                                <span className="font-semibold">{details.rating}</span>
                                                                <span className="text-yellow-500">
                                                                    {'★'.repeat(Math.round(details.rating))}
                                                                    {'☆'.repeat(5 - Math.round(details.rating))}
                                                                </span>
                                                                <span className="text-muted-foreground text-sm">
                                                                    ({details.user_ratings_total?.toLocaleString()})
                                                                </span>
                                                                {details.price_level && (
                                                                    <span className="ml-auto text-muted-foreground font-medium text-sm">
                                                                        {'$'.repeat(details.price_level)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {details.formatted_address && (
                                                                <div className="flex gap-2 items-start">
                                                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                                                    <span className="text-sm">{details.formatted_address}</span>
                                                                </div>
                                                            )}
                                                            {details.opening_hours && (
                                                                <div className="flex gap-2 items-center">
                                                                    <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                                    <span className={`text-sm font-semibold ${details.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                                                        {details.opening_hours.open_now ? t.results.openNow : t.results.closed}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {details.formatted_phone_number && (
                                                                <div className="flex gap-2 items-center">
                                                                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                                    <span className="text-sm">{details.formatted_phone_number}</span>
                                                                </div>
                                                            )}
                                                            {details.website && (
                                                                <div className="flex gap-2 items-center">
                                                                    <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                                    <a href={details.website} target="_blank" rel="noopener noreferrer"
                                                                        className="text-sm text-[#2d6a2d] hover:underline truncate">
                                                                        {details.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {details.url && (
                                                                <a href={details.url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-sm text-[#2d6a2d] hover:underline pt-1">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    {t.results.viewOnGoogleMaps}
                                                                </a>
                                                            )}

                                                            {/* Vote button — locked players only, one vote */}
                                                            {isLocked && (
                                                                <button
                                                                    onClick={() => handleVoteRestaurant(place.place_id)}
                                                                    disabled={!!myVote}
                                                                    className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                                                                        hasVotedThis
                                                                            ? 'bg-[#2d6a2d] text-white cursor-default'
                                                                            : myVote
                                                                                ? 'bg-[#c8dcc8] text-[#5a7a5a] cursor-not-allowed'
                                                                                : 'bg-[#2d6a2d] hover:bg-[#266226] text-white cursor-pointer'
                                                                    }`}
                                                                >
                                                                    {hasVotedThis ? t.results.yourVote : myVote ? t.results.alreadyVoted : t.results.voteForThis}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    </FollowerPointerCard>

                    {/* Right: Leaflet map */}
                    <div className="flex-1 rounded-xl overflow-hidden shadow-sm">
                        {loading ? (
                            <Skeleton className="w-full h-full" />
                        ) : places.length > 0 && (
                            <MapContainer center={mapCenter} zoom={12} className="w-full h-full">
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <MapController selectedPlaceId={selectedPlaceId} places={places} />
                                {userLocation && (
                                    <Marker position={userLocation} icon={youAreHereIcon} />
                                )}
                                {places.map((place) => (
                                    place.geometry?.location && (
                                        <Marker
                                            key={place.place_id}
                                            position={[place.geometry.location.lat, place.geometry.location.lng]}
                                            eventHandlers={{ click: () => handleSelectPlace(place) }}
                                        >
                                            <Popup className="veto-popup" maxWidth={280} minWidth={240}>
                                                {placeDetailsMap[place.place_id]?.photos?.[0]?.photo_reference && (
                                                    <img
                                                        src={`${API_BASE_URL}/api/place-photo?ref=${placeDetailsMap[place.place_id].photos[0].photo_reference}`}
                                                        alt={place.name}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                )}
                                                <div className="p-4 space-y-2">
                                                    <p className="font-bold text-base leading-tight">{place.name}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold text-sm">{place.rating}</span>
                                                        <span className="text-yellow-500 text-sm">
                                                            {'★'.repeat(Math.round(place.rating))}{'☆'.repeat(5 - Math.round(place.rating))}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">({place.user_ratings_total?.toLocaleString()})</span>
                                                        {place.price_level && (
                                                            <span className="text-gray-500 text-xs ml-1">· {'$'.repeat(place.price_level)}</span>
                                                        )}
                                                    </div>
                                                    {place.formatted_address && (
                                                        <div className="flex gap-2 items-start">
                                                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                                            <span className="text-xs text-gray-600">{place.formatted_address}</span>
                                                        </div>
                                                    )}
                                                    {placeDetailsMap[place.place_id]?.opening_hours && (
                                                        <div className="flex gap-2 items-center">
                                                            <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                            <span className={`text-sm font-medium ${placeDetailsMap[place.place_id].opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                                                {placeDetailsMap[place.place_id].opening_hours.open_now ? t.results.openNow : t.results.closed}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}
                            </MapContainer>
                        )}
                    </div>

                </div>
            </div>
        </Layout>
    );
};
