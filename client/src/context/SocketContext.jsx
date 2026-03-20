import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [prices, setPrices] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', user._id);
      // Subscribe to user's watchlist
      if (user.watchlist?.length) {
        socket.emit('subscribe', user.watchlist);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    // Bulk price update (all tickers)
    socket.on('prices_bulk', (priceList) => {
      setPrices((prev) => {
        const next = { ...prev };
        priceList.forEach((p) => { next[p.ticker] = p; });
        return next;
      });
    });

    // Individual ticker update
    socket.on('price_update', (priceData) => {
      setPrices((prev) => ({ ...prev, [priceData.ticker]: priceData }));
    });

    // Price alert triggered
    socket.on('price_alert', (alert) => {
      setAlerts((prev) => [{ ...alert, id: Date.now() }, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const dismissAlert = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, prices, alerts, connected, dismissAlert }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
