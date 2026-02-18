import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Btn, Badge, Card, Modal, Input, Select, Loader } from '../components/UI';
import { Icon } from '../components/Icons';
import { fmtNum } from '../utils/format';

export function StockPage() {
    const { toast, t, searchQuery } = useApp();
    const [inventory, setInventory] = useState([]);
    const [movements, setMovements] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ product_id: "", quantity: "", note: "" });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [inv, mov, prod] = await Promise.all([
            supabase.from("inventory").select("*").order("category"),
            supabase.from("stock_movements").select("*, products(*, categories(name), colors(name))").order("created_at", { ascending: false }).limit(20),
            supabase.from("products").select("*, categories(name), colors(name)").order("created_at"),
        ]);
        setInventory(inv.data || []);
        setMovements(mov.data || []);
        setProducts(prod.data || []);
        setLoading(false);
    };

    const saveStock = async () => {
        if (!form.product_id || !form.quantity || +form.quantity <= 0) return toast("შეავსეთ ველები", "error");

        if (editItem) {
            const { error } = await supabase.from("stock_movements").update({
                product_id: form.product_id,
                quantity: +form.quantity,
                note: form.note
            }).eq("id", editItem);
            if (error) return toast("შეცდომა", "error");
            toast("ჩანაწერი განახლდა ✓");
        } else {
            const { error } = await supabase.from("stock_movements").insert({
                product_id: form.product_id,
                quantity: +form.quantity,
                note: form.note
            });
            if (error) return toast("შეცდომა", "error");
            toast("სტოკი დაემატა ✓");
        }

        setModal(false); setEditItem(null); setForm({ product_id: "", quantity: "", note: "" }); loadData();
    };

    const openEdit = (m) => {
        setEditItem(m.id);
        setForm({
            product_id: m.product_id,
            quantity: m.quantity,
            note: m.note || ""
        });
        setModal(true);
    };

    const deleteMovement = async (id) => {
        if (!confirm("ჩანაწერის წაშლა?")) return;
        const { error } = await supabase.from("stock_movements").delete().eq("id", id);
        if (error) return toast("შეცდომა წაშლისას", "error");
        toast("ჩანაწერი წაიშალა");
        loadData();
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>საწყობი</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>ლისტების ნაშთი</p>
                </div>
                <Btn variant="success" onClick={() => { setModal(true); setEditItem(null); setForm({ product_id: "", quantity: "", note: "" }); }}>{Icon.plus} ლისტების შემოსვლა</Btn>
            </div>
            <div className="grid gap-3">
                {inventory.filter(p => {
                    const query = searchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return (
                        p.category?.toLowerCase().includes(query) ||
                        p.color?.toLowerCase().includes(query) ||
                        p.thickness?.toLowerCase().includes(query)
                    );
                }).map(p => (
                    <div key={p.product_id} className="rounded-2xl p-4 flex items-center gap-4 border" style={{ background: t.card, borderColor: t.border }}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold" style={{ color: t.text }}>{p.color} — {p.category}</p>
                                <Badge>{p.thickness}</Badge>
                            </div>
                            <div className="flex gap-4 mt-1.5 text-xs" style={{ color: t.textFaint }}>
                                <span>სულ შემოვიდა: {fmtNum(p.total_in)} ლ.</span>
                                <span>გაყიდული: {fmtNum(p.total_sold)} ლ.</span>
                            </div>
                        </div>
                        <Badge color={p.stock > 15 ? "green" : p.stock > 0 ? "gold" : "red"}>{fmtNum(p.stock)} ლისტი</Badge>
                    </div>
                ))}
            </div>
            <Card>
                <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>📥 შემოსვლის ისტორია</h3>
                <div className="space-y-2">
                    {movements.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl text-sm border hover:border-gray-500 transition-colors" style={{ background: t.input, borderColor: t.border }}>
                            <div className="flex-1">
                                <p style={{ color: t.text }}>{m.products?.colors?.name} — {m.products?.categories?.name}</p>
                                {m.note && <p className="text-xs" style={{ color: t.textFaint }}>{m.note}</p>}
                                <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>{new Date(m.created_at).toLocaleDateString("ka-GE")}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <Badge color="green">+{m.quantity} ლ.</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(m)} style={{ color: t.textMuted }} className="hover:opacity-70 transition-opacity p-1">{Icon.edit}</button>
                                    <button onClick={() => deleteMovement(m.id)} style={{ color: "#ef4444" }} className="hover:opacity-70 transition-opacity p-1">{Icon.trash}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {movements.length === 0 && <p className="text-sm" style={{ color: t.textFaint }}>შემოსვლები არ არის</p>}
                </div>
            </Card>
            {modal && (
                <Modal title={editItem ? "ჩანაწერის რედაქტირება" : "ლისტების შემოსვლა"} onClose={() => setModal(false)}>
                    <Select label="პროდუქტი" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                        <option value="">აირჩიეთ პროდუქტი</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.colors?.name} — {p.categories?.name} ({p.thickness})</option>)}
                    </Select>
                    <Input label="რაოდენობა (ლისტი)" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="1" />
                    <Input label="შენიშვნა (სურვილისამებრ)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="მიმწოდებელი, ინვოისი..." />
                    <Btn variant="success" className="w-full justify-center mt-2" onClick={saveStock}>{editItem ? "განახლება" : "შემოსვლის დამატება"}</Btn>
                </Modal>
            )}
        </div>
    );
}

