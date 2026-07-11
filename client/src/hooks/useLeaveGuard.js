import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PLAYER_LEAVE_MESSAGE =
    "Leave the game? You'll be removed and the others will continue without you.";
const HOST_LEAVE_MESSAGE =
    "Leave as host? Another player will take over and the game will continue. " +
    "If you're the only player, this will end the game.";

/**
 * Warns before an in-progress lobby session is abandoned via browser back/forward
 * or tab close/refresh. Confirmed host departures hand off to another player via
 * the `transferHost` event instead of silently destroying the lobby on disconnect.
 *
 * Pass `isHost` if the caller already tracks it (e.g. Lobby.jsx); otherwise the
 * hook requests it itself via `updateLobby`/`selfInfo`.
 */
export function useLeaveGuard({ socket, code, isHost: isHostProp }) {
    const navigate = useNavigate();
    const isHostRef = useRef(isHostProp ?? false);
    const socketRef = useRef(socket);
    const codeRef = useRef(code);

    useEffect(() => {
        if (isHostProp !== undefined) isHostRef.current = isHostProp;
    }, [isHostProp]);

    useEffect(() => {
        socketRef.current = socket;
        codeRef.current = code;
    }, [socket, code]);

    // Self-manage isHost when the caller doesn't already track it
    useEffect(() => {
        if (isHostProp !== undefined || !socket || !code) return;

        const handleSelfInfo = ({ isHost }) => {
            isHostRef.current = isHost;
        };

        socket.on('selfInfo', handleSelfInfo);
        socket.emit('updateLobby', { lobbyCode: code });

        return () => socket.off('selfInfo', handleSelfInfo);
    }, [socket, code, isHostProp]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);

        const handlePopState = () => {
            const host = isHostRef.current;
            const confirmed = window.confirm(host ? HOST_LEAVE_MESSAGE : PLAYER_LEAVE_MESSAGE);

            if (!confirmed) {
                window.history.pushState(null, '', window.location.href);
                return;
            }

            const sock = socketRef.current;
            const lobbyCode = codeRef.current;
            if (host && sock && lobbyCode) {
                sock.emit('transferHost', { lobbyCode });
            }

            navigate('/', { replace: true });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [navigate]);
}
