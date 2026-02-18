import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Btn } from './UI';

export function InstallPrompt() {
    const { t } = useApp();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstall(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowInstall(false);
        }

        setDeferredPrompt(null);
    };

    if (!showInstall) return null;

    return (
        <Btn
            variant="success"
            onClick={handleInstall}
            className="flex items-center gap-2"
        >
            📥 დააინსტალირე
        </Btn>
    );
}
