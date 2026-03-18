import { useSocket } from '../../context/SocketContext';

export default function AlertToast() {
  const { alerts, dismissAlert } = useSocket();

  if (!alerts.length) return null;

  return (
    <div className="alert-toast">
      {alerts.map((alert) => (
        <div key={alert.id} className="toast">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 500, marginBottom: 4 }}>
                📈 Price Alert — {alert.ticker}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{alert.message}</div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
