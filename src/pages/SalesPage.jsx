import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Btn, Badge, Card, Modal, Input, Select, Loader, StatCard } from '../components/UI';
import { Icon } from '../components/Icons';
import { fmt, fmtNum } from '../utils/format';

export function SalesPage() {
    const { toast, t, searchQuery } = useApp();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ product_id: "", customer_id: "", quantity: "", sale_price: "", note: "" });
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const [s, p, c] = await Promise.all([
            supabase.from("sales").select("*, customers(full_name), products(*, categories(name), colors(name))").order("created_at", { ascending: false }),
            supabase.from("products").select("*, categories(name), colors(name)").order("created_at"),
            supabase.from("customers").select("*").order("full_name"),
        ]);
        setSales(s.data || []);
        setProducts(p.data || []);
        setCustomers(c.data || []);
        setLoading(false);
    };

    const saveSale = async () => {
        if (!form.product_id || !form.quantity || +form.quantity <= 0 || !form.sale_price) {
            return toast("შეავსეთ ყველა სავალდებულო ველი", "error");
        }

        const payload = {
            product_id: form.product_id,
            customer_id: form.customer_id || null,
            quantity: +form.quantity,
            sale_price: +form.sale_price,
            note: form.note || null,
        };

        if (editItem) {
            const { error } = await supabase.from("sales").update(payload).eq("id", editItem);
            if (error) return toast("შეცდომა: " + error.message, "error");
            toast("გაყიდვა განახლდა");
        } else {
            const { error } = await supabase.from("sales").insert(payload);
            if (error) return toast("შეცდომა: " + error.message, "error");
            toast("გაყიდვა დაემატა");
        }

        setModal(false);
        setEditItem(null);
        setForm({ product_id: "", customer_id: "", quantity: "", sale_price: "", note: "" });
        loadData();
    };

    const openEdit = (s) => {
        setEditItem(s.id);
        setForm({
            product_id: s.product_id,
            customer_id: s.customer_id || "",
            quantity: s.quantity,
            sale_price: s.sale_price,
            note: s.note || "",
        });
        setModal(true);
    };

    const deleteSale = async (id) => {
        if (!confirm("გაყიდვის ჩანაწერის წაშლა?")) return;
        const { error } = await supabase.from("sales").delete().eq("id", id);
        if (error) return toast("შეცდომა წაშლისას", "error");
        toast("ჩანაწერი წაიშალა");
        loadData();
    };

    const onProductSelect = (productId) => {
        const product = products.find(p => p.id === productId);
        setForm(prev => ({
            ...prev,
            product_id: productId,
            sale_price: product ? product.sale_price : prev.sale_price,
        }));
    };

    if (loading) return <Loader />;

    const filteredSales = sales.filter(s => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || (
            s.customers?.full_name?.toLowerCase().includes(query) ||
            s.products?.colors?.name?.toLowerCase().includes(query) ||
            s.products?.categories?.name?.toLowerCase().includes(query) ||
            s.note?.toLowerCase().includes(query)
        );

        const saleDate = new Date(s.created_at);
        const matchesDateFrom = !dateFrom || saleDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || saleDate <= new Date(dateTo + "T23:59:59");

        return matchesSearch && matchesDateFrom && matchesDateTo;
    });

    const totals = filteredSales.reduce((acc, s) => ({
        count: acc.count + 1,
        quantity: acc.quantity + (s.quantity || 0),
        revenue: acc.revenue + (s.sale_price * s.quantity),
    }), { count: 0, quantity: 0, revenue: 0 });

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>გაყიდვები</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>{sales.length} ტრანზაქცია</p>
                </div>
                <Btn onClick={() => { setModal(true); setEditItem(null); setForm({ product_id: "", customer_id: "", quantity: "", sale_price: "", note: "" }); }}>
                    {Icon.plus} ახალი გაყიდვა
                </Btn>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="ტრანზაქციები" value={fmtNum(totals.count)} sub="გაყიდვის ჩანაწერი" color="#60a5fa" />
                <StatCard label="გაყიდული" value={`${fmtNum(totals.quantity)} ლ.`} sub="ლისტი სულ" />
                <StatCard label="შემოსავალი" value={fmt(totals.revenue)} sub="ჯამური თანხა" color="#34d399" />
            </div>

            <Card>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                    <p className="text-sm font-medium" style={{ color: t.textMuted }}>ფილტრი:</p>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="rounded-xl px-3 py-2 text-sm border focus:outline-none"
                        style={{ background: t.input, borderColor: t.inputBorder, color: t.text }}
                    />
                    <span style={{ color: t.textFaint }}>-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="rounded-xl px-3 py-2 text-sm border focus:outline-none"
                        style={{ background: t.input, borderColor: t.inputBorder, color: t.text }}
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(""); setDateTo(""); }}
                            className="text-xs px-3 py-2 rounded-xl border transition-colors"
                            style={{ color: t.textMuted, borderColor: t.inputBorder, background: t.input }}
                        >
                            გასუფთავება
                        </button>
                    )}
                </div>
            </Card>

            <div className="grid gap-3">
                {filteredSales.map(s => {
                    const total = s.sale_price * s.quantity;
                    return (
                        <div key={s.id} className="rounded-2xl p-4 flex items-center gap-4 border" style={{ background: t.card, borderColor: t.border }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(52,211,153,0.15)" }}>
                                <span style={{ color: "#34d399" }}>{Icon.sales}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold" style={{ color: t.text }}>
                                        {s.products?.colors?.name} — {s.products?.categories?.name}
                                    </p>
                                    <Badge color="blue">{s.quantity} ლისტი</Badge>
                                </div>
                                <div className="flex gap-3 mt-1 text-xs flex-wrap" style={{ color: t.textFaint }}>
                                    {s.customers?.full_name && <span>კლიენტი: {s.customers.full_name}</span>}
                                    <span>ფასი: {fmt(s.sale_price)}/ლ.</span>
                                    <span>{new Date(s.created_at).toLocaleDateString("ka-GE")}</span>
                                </div>
                                {s.note && <p className="text-xs mt-0.5 truncate" style={{ color: t.textFaint }}>{s.note}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#34d399" }}>{fmt(total)}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(s)} style={{ color: t.textMuted }} className="hover:opacity-70 transition-opacity p-1">{Icon.edit}</button>
                                    <button onClick={() => deleteSale(s.id)} style={{ color: "#ef4444" }} className="hover:opacity-70 transition-opacity p-1">{Icon.trash}</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredSales.length === 0 && (
                    <Card className="text-center py-12">
                        <p className="text-4xl mb-3">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mx-auto" style={{ color: t.textFaint }}>
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </p>
                        <p style={{ color: t.textFaint }}>გაყიდვები არ მოიძებნა</p>
                    </Card>
                )}
            </div>

            {modal && (
                <Modal title={editItem ? "გაყიდვის რედაქტირება" : "ახალი გაყიდვა"} onClose={() => setModal(false)}>
                    <Select label="პროდუქტი *" value={form.product_id} onChange={e => onProductSelect(e.target.value)}>
                        <option value="">აირჩიეთ პროდუქტი</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.colors?.name} — {p.categories?.name} ({p.thickness})
                            </option>
                        ))}
                    </Select>
                    <Select label="კლიენტი" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                        <option value="">აირჩიეთ კლიენტი (სურვილისამებრ)</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.full_name}</option>
                        ))}
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="რაოდენობა (ლისტი) *" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" min="1" />
                        <Input label="გაყიდვის ფასი (1 ლ.) *" type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="0.00" />
                    </div>
                    <Input label="შენიშვნა" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="დამატებითი ინფო..." />
                    <Btn className="w-full justify-center mt-2" onClick={saveSale}>{editItem ? "განახლება" : "გაყიდვის დამატება"}</Btn>
                </Modal>
            )}
        </div>
    );
}
