import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Input, Btn, Card, Logo } from '../components/UI';

export function LoginPage() {
    const { t } = useApp();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("მეილი ან პაროლი არასწორია");
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 page-enter" style={{ background: t.bg }}>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Logo size="lg" className="mb-4" />
                    <h1 className="text-2xl font-bold font-display tracking-wider" style={{ color: t.text }}>MALEMA LTD</h1>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>საწყობის მართვის სისტემა</p>
                </div>
                <Card>
                    <form onSubmit={handleLogin}>
                        <Input label="ელ. ფოსტა" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
                        <Input label="პაროლი" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                        {error && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>{error}</p>}
                        <Btn type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? "შესვლა..." : "შესვლა"}
                        </Btn>
                    </form>
                </Card>
            </div>
        </div>
    );
}
