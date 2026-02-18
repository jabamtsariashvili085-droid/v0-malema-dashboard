import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Btn, Card, Modal, Input, Loader, Pagination, ConfirmDialog, usePagination, useConfirm } from '../components/UI';
import { Icon } from '../components/Icons';

export function CustomersPage() {
    const { toast, t, searchQuery } = useApp();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ full_name: "", phone: "", note: "" });
    const { confirm, dialogProps } = useConfirm();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const { data } = await supabase.from("customers").select("*").order("full_name");
        setCustomers(data || []); setLoading(false);
    };

    const save = async () => {
        if (!form.full_name.trim()) return toast("შეიყვანეთ სახელი", "error");
        if (editItem) {
            await supabase.from("customers").update(form).eq("id", editItem);
            toast("მომხმარებელი განახლდა");
        } else {
            await supabase.from("customers").insert(form);
            toast("მომხმარებელი დაემატა");
        }
        setModal(false); setEditItem(null); setForm({ full_name: "", phone: "", note: "" }); loadData();
    };

    const del = async (id) => {
        const ok = await confirm("მომხმარებლის წაშლა", "ნამდვილად გსურთ ამ მომხმარებლის წაშლა? ეს მოქმედება შეუქცევადია.");
        if (!ok) return;
        await supabase.from("customers").delete().eq("id", id);
        toast("წაიშალა"); loadData();
    };

    const filteredCustomers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return customers;
        return customers.filter(c =>
            c.full_name?.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.note?.toLowerCase().includes(query)
        );
    }, [customers, searchQuery]);

    const { page, totalPages, paged, goTo, totalItems, perPage } = usePagination(filteredCustomers, 20);

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>მომხმარებლები</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>{customers.length} კლიენტი</p>
                </div>
                <Btn onClick={() => { setModal(true); setEditItem(null); setForm({ full_name: "", phone: "", note: "" }); }}>{Icon.plus} ახალი კლიენტი</Btn>
            </div>
            <div className="grid gap-3">
                {paged.map(c => (
                    <div key={c.id} className="rounded-2xl p-4 flex items-center gap-4 border" style={{ background: t.card, borderColor: t.border }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.accentBg }}>
                            <span className="font-bold text-sm" style={{ color: t.accent }}>{c.full_name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold" style={{ color: t.text }}>{c.full_name}</p>
                            <div className="flex gap-3 text-xs mt-0.5" style={{ color: t.textFaint }}>
                                {c.phone && (
                                    <a href={`tel:${c.phone}`} style={{ color: t.accent }} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                                        📞 {c.phone}
                                    </a>
                                )}
                                {c.note && <span>{c.note}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Btn variant="ghost" className="p-2" onClick={() => { setEditItem(c.id); setForm({ full_name: c.full_name, phone: c.phone || "", note: c.note || "" }); setModal(true); }}>{Icon.edit}</Btn>
                            <Btn variant="danger" className="p-2" onClick={() => del(c.id)}>{Icon.trash}</Btn>
                        </div>
                    </div>
                ))}
                {filteredCustomers.length === 0 && (
                    <Card className="text-center py-12">
                        <p className="text-4xl mb-3">👤</p>
                        <p style={{ color: t.textFaint }}>კლიენტები ჯერ არ არის</p>
                    </Card>
                )}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={goTo} totalItems={totalItems} perPage={perPage} />
            </div>
            {modal && (
                <Modal title={editItem ? "კლიენტის რედაქტირება" : "ახალი კლიენტი"} onClose={() => setModal(false)}>
                    <Input label="სახელი გვარი" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="მაგ: ნიკა ერაძე" autoFocus />
                    <Input label="ტელეფონი (სურვილისამებრ)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+995 5XX XXX XXX" />
                    <Input label="შენიშვნა (სურვილისამებრ)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="დამატებითი ინფო..." />
                    <Btn className="w-full justify-center mt-2" onClick={save}>{editItem ? "განახლება" : "დამატება"}</Btn>
                </Modal>
            )}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
