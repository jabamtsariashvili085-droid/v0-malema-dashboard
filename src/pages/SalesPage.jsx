import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Btn, Badge, Card, Modal, Input, Select, Loader } from '../components/UI';
import { Icon } from '../components/Icons';
import { fmt } from '../utils/format';

export function SalesPage() {
    const { toast, t, searchQuery } = useApp();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ customer_id: "", product_id: "", quantity: "", sale_price: "" });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [s, p, c] = await Promise.all([
            supabase.from("sales").select("*, customers(full_name), products(*, categories(name), colors(name))").order("created_at", { ascending: false }),
            supabase.from("inventory").select("*"),
            supabase.from("customers").select("*").order("full_name"),
        ]);
        setSales(s.data || []);
        // When editing, we might need the current product even if stock is 0
        setProducts(p.data || []);
        setCustomers(c.data || []);
        setLoading(false);
    };

    const handleProductChange = (productId) => {
        const p = products.find(x => x.product_id === productId);
        setForm({ ...form, product_id: productId, sale_price: p ? p.sale_price : "" });
    };

    const saveSale = async () => {
        if (!form.product_id || !form.quantity || !form.sale_price) return toast("შეავსეთ ყველა ველი", "error");

        const prod = products.find(p => p.product_id === form.product_id);
        // If it's a new sale or changing product/increasing quantity, check stock
        // For simplicity, we'll check against current inventory view
        if (!editItem && prod && +form.quantity > prod.stock) {
            return toast(`სტოკში მხოლოდ ${prod.stock} ლისტია`, "error");
        }

        if (editItem) {
            const { error } = await supabase.from("sales").update({
                customer_id: form.customer_id || null,
                product_id: form.product_id,
                quantity: +form.quantity,
                sale_price: +form.sale_price
            }).eq("id", editItem);
            if (error) return toast("შეცდომა განახლებისას", "error");
            toast("გაყიდვა განახლდა ✓");
        } else {
            const { error } = await supabase.from("sales").insert({
                customer_id: form.customer_id || null,
                product_id: form.product_id,
                quantity: +form.quantity,
                sale_price: +form.sale_price
            });
            if (error) return toast("შეცდომა რეგისტრაციისას", "error");
            toast("გაყიდვა დარეგისტრირდა ✓");
        }

        setModal(false); setEditItem(null);
        setForm({ customer_id: "", product_id: "", quantity: "", sale_price: "" });
        loadData();
    };

    const openEdit = (s) => {
        setEditItem(s.id);
        setForm({
            customer_id: s.customer_id,
            product_id: s.product_id,
            quantity: s.quantity,
            sale_price: s.sale_price
        });
        setModal(true);
    };

    const deleteSale = async (id) => {
        if (!confirm("გაყიდვის გაუქმება?")) return;
        await supabase.from("sales").delete().eq("id", id);
        toast("გაყიდვა გაუქმდა"); loadData();
    };

    if (loading) return <Loader />;
    const totalRevenue = sales.reduce((s, x) => s + x.sale_price * x.quantity, 0);

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>გაყიდვები</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>სულ: {fmt(totalRevenue)}</p>
                </div>
                <Btn onClick={() => { setModal(true); setEditItem(null); setForm({ customer_id: "", product_id: "", quantity: "", sale_price: "" }); }}>{Icon.plus} ახალი გაყიდვა</Btn>
            </div>
            <div className="grid gap-3">
                {sales.filter(s => {
                    const query = searchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return (
                        (s.customers?.full_name || "ანონიმური").toLowerCase().includes(query) ||
                        s.products?.colors?.name?.toLowerCase().includes(query) ||
                        s.products?.categories?.name?.toLowerCase().includes(query) ||
                        new Date(s.created_at).toLocaleDateString("ka-GE").includes(query)
                    );
                }).map(s => (
                    <div key={s.id} className="rounded-2xl p-4 flex items-center gap-4 border glass" style={{ borderColor: t.border }}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold" style={{ color: t.text }}>{s.customers?.full_name || "ანონიმური"}</p>
                                <Badge color="blue">{s.products?.colors?.name} — {s.products?.categories?.name}</Badge>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs" style={{ color: t.textFaint }}>
                                <span>{s.quantity} ლისტი × {fmt(s.sale_price)}</span>
                                <span>{new Date(s.created_at).toLocaleDateString("ka-GE")}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold" style={{ color: "#34d399" }}>{fmt(s.sale_price * s.quantity)}</span>
                            <div className="flex gap-2">
                                <Btn variant="ghost" className="p-2" onClick={() => openEdit(s)}>{Icon.edit}</Btn>
                                <Btn variant="danger" className="p-2" onClick={() => deleteSale(s.id)}>{Icon.trash}</Btn>
                            </div>
                        </div>
                    </div>
                ))}
                {sales.length === 0 && (
                    <Card className="text-center py-12">
                        <p className="text-4xl mb-3">🛒</p>
                        <p style={{ color: t.textFaint }}>გაყიდვები ჯერ არ არის</p>
                    </Card>
                )}
            </div>
            {modal && (
                <Modal title={editItem ? "გაყიდვის რედაქტირება" : "ახალი გაყიდვა"} onClose={() => setModal(false)}>
                    <Select label="მომხმარებელი" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                        <option value="">აირჩიეთ მომხმარებელი</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </Select>
                    <Select label="პროდუქტი" value={form.product_id} onChange={e => handleProductChange(e.target.value)}>
                        <option value="">აირჩიეთ პროდუქტი</option>
                        {/* Show all products for editing, but only in-stock for new sales */}
                        {(editItem ? products : products.filter(p => p.stock > 0)).map(p => (
                            <option key={p.product_id} value={p.product_id}>{p.color} — {p.category} ({p.thickness}) {!editItem ? `— ${p.stock} ლ.` : ""}</option>
                        ))}
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="რაოდენობა" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="1" />
                        <Input label="ფასი (₾/ლ)" type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="0.00" />
                    </div>
                    {form.quantity && form.sale_price && (
                        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: t.input }}>
                            <span style={{ color: t.textMuted }}>სულ: </span>
                            <span className="font-bold" style={{ color: "#34d399" }}>{fmt(+form.quantity * +form.sale_price)}</span>
                        </div>
                    )}
                    <Btn className="w-full justify-center" onClick={saveSale}>{editItem ? "განახლება" : "გაყიდვის რეგისტრაცია"}</Btn>
                </Modal>
            )}
        </div>
    );
}
