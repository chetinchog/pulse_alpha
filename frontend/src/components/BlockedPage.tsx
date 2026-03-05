import { useAuth } from '../contexts/AuthContext';

export default function BlockedPage() {
    const { signOut, user } = useAuth();

    return (
        <div className="blocked-root">
            {/* Animated background */}
            <div className="blocked-bg">
                <div className="blocked-orb blocked-orb-1" />
                <div className="blocked-orb blocked-orb-2" />
            </div>
            <div className="login-grid" />

            {/* Card */}
            <div className="blocked-card">
                {/* Animated icon */}
                <div className="blocked-icon-wrapper">
                    <div className="blocked-icon-ring" />
                    <div className="blocked-icon">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="w-full h-full object-cover rounded-full"
                            />
                        ) : (
                            <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Main message */}
                <h1 className="blocked-title">Tu portfolio se está refinando...</h1>

                {/* Animated dots */}
                <div className="blocked-dots">
                    <span className="blocked-dot" />
                    <span className="blocked-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="blocked-dot" style={{ animationDelay: '0.4s' }} />
                </div>

                {/* Sub message */}
                <p className="blocked-subtitle">
                    Después de 24h de espera, contactate con iCTG
                </p>

                {/* Removed User info per request */}

                {/* Sign out */}
                <button
                    id="blocked-signout-btn"
                    className="blocked-signout-btn"
                    onClick={signOut}
                >
                    Cerrar sesión
                </button>
            </div>

            {/* Bottom badge */}
            <div className="login-bottom-badge">
                <span>By iCTG</span>
                <span className="login-badge-dot">·</span>
                <span>Pulse Alpha</span>
            </div>
        </div>
    );
}
