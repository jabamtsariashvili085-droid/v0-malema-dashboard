import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Btn, Badge, Card, Modal, Input, Select, Loader, Logo, Pagination, ConfirmDialog, usePagination, useConfirm } from '../components/UI';
import { Icon } from '../components/Icons';
import { fmt } from '../utils/format';

export function ProductsPage() {
    const { toast, t, searchQuery } = useApp();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ category_id: "", color_id: "", thickness: "18მმ", description: "", purchase_price: "", sale_price: "" });
    const [newName, setNewName] = useState("");
    const fileInputRef = useRef(null);
    const { confirm, dialogProps } = useConfirm();

    const downloadTemplate = () => {
        const link = document.createElement("a");
        link.href = "/პროდუქტების_ნიმუში.xlsx";
        link.download = "პროდუქტების_ნიმუში.xlsx";
        link.click();
    };

    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        let added = 0, skipped = 0;
        for (const row of rows) {
            const catName = row["კატეგორია"]?.toString().trim();
            const colName = row["ფერი"]?.toString().trim();
            const thickness = row["სისქე"]?.toString().trim() || "18მმ";
            if (!catName || !colName) { skipped++; continue; }
            let { data: cat } = await supabase.from("categories").select("id").eq("name", catName).single();
            if (!cat) {
                const { data: newCat } = await supabase.from("categories").insert({ name: catName }).select().single();
                cat = newCat;
            }
            let { data: col } = await supabase.from("colors").select("id").eq("name", colName).single();
            if (!col) {
                const { data: newCol } = await supabase.from("colors").insert({ name: colName }).select().single();
                col = newCol;
            }
            await supabase.from("products").insert({
                category_id: cat.id,
                color_id: col.id,
                thickness,
                description: row["აღწერა"]?.toString() || "",
                purchase_price: parseFloat(row["შეძენის ფასი"]) || 0,
                sale_price: parseFloat(row["გაყიდვის ფასი"]) || 0,
            });
            added++;
        }
        toast(`დაემატა ${added} პროდუქტი${skipped ? `, გამოტოვდა ${skipped}` : ""}`);
        e.target.value = "";
        loadAll();
    };

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        const [p, c, col] = await Promise.all([
            supabase.from("inventory").select("*").order("category"),
            supabase.from("categories").select("*").order("name"),
            supabase.from("colors").select("*").order("name"),
        ]);
        setProducts(p.data || []);
        setCategories(c.data || []);
        setColors(col.data || []);
        setLoading(false);
    };

    const saveProduct = async () => {
        if (!form.category_id || !form.color_id || !form.purchase_price || !form.sale_price) return toast("შეავსეთ ყველა ველი", "error");
        if (editItem) {
            const { error } = await supabase.from("products").update({ ...form, purchase_price: +form.purchase_price, sale_price: +form.sale_price }).eq("id", editItem);
            if (error) return toast("შეცდომა", "error");
            toast("პროდუქტი განახლდა");
        } else {
            const { error } = await supabase.from("products").insert({ ...form, purchase_price: +form.purchase_price, sale_price: +form.sale_price });
            if (error) return toast("შეცდომა", "error");
            toast("პროდუქტი დაემატა");
        }
        setModal(null); setEditItem(null);
        setForm({ category_id: "", color_id: "", thickness: "18მმ", description: "", purchase_price: "", sale_price: "" });
        loadAll();
    };

    const deleteProduct = async (id) => {
        const ok = await confirm("პროდუქტის წაშლა", "ნამდვილად გსურთ ამ პროდუქტის წაშლა? ეს მოქმედება შეუქცევადია.");
        if (!ok) return;
        await supabase.from("products").delete().eq("id", id);
        toast("პროდუქტი წაიშალა");
        loadAll();
    };

    const saveCategory = async () => {
        if (!newName.trim()) return;
        await supabase.from("categories").insert({ name: newName.trim() });
        toast("კატეგორია დაემატა"); setModal(null); setNewName(""); loadAll();
    };

    const saveColor = async () => {
        if (!newName.trim()) return;
        await supabase.from("colors").insert({ name: newName.trim() });
        toast("ფერი დაემატა"); setModal(null); setNewName(""); loadAll();
    };

    const openEdit = (p) => {
        setEditItem(p.product_id);
        setForm({ category_id: "", color_id: "", thickness: p.thickness, description: p.description || "", purchase_price: p.purchase_price, sale_price: p.sale_price });
        setModal("product");
    };

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return products;
        return products.filter(p =>
            p.category?.toLowerCase().includes(query) ||
            p.color?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.thickness?.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    const { page, totalPages, paged, goTo, totalItems, perPage } = usePagination(filteredProducts, 20);

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>პროდუქტები</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>{products.length} პროდუქტი</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Btn variant="ghost" onClick={() => { setModal("category"); setNewName(""); }}>{Icon.plus} კატეგორია</Btn>
                    <Btn variant="ghost" onClick={() => { setModal("color"); setNewName(""); }}>{Icon.plus} ფერი</Btn>
                    <Btn variant="ghost" onClick={downloadTemplate}>⬇️ ნიმუში</Btn>
                    <Btn variant="success" onClick={() => fileInputRef.current.click()}>📥 Excel იმპორტი</Btn>
                    <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleExcelImport} />
                    <Btn onClick={() => { setModal("product"); setEditItem(null); setForm({ category_id: "", color_id: "", thickness: "18მმ", description: "", purchase_price: "", sale_price: "" }); }}>{Icon.plus} პროდუქტი</Btn>
                </div>
            </div>
            <div className="grid gap-3">
                {paged.map(p => (
                    <div key={p.product_id} className="rounded-2xl p-4 flex items-center gap-4 border" style={{ background: t.card, borderColor: t.border }}>
                        <Logo size="sm" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold" style={{ color: t.text }}>{p.color} — {p.category}</p>
                                <Badge>{p.thickness}</Badge>
                                <Badge color={p.stock > 5 ? "green" : p.stock > 0 ? "gold" : "red"}>{p.stock} ლისტი</Badge>
                            </div>
                            {p.description && <p className="text-xs mt-0.5 truncate" style={{ color: t.textFaint }}>{p.description}</p>}
                            <div className="flex gap-4 mt-1 text-xs" style={{ color: t.textFaint }}>
                                <span>შ/ფასი: {fmt(p.purchase_price)}</span>
                                <span>გ/ფასი: {fmt(p.sale_price)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Btn variant="ghost" className="p-2" onClick={() => openEdit(p)}>{Icon.edit}</Btn>
                            <Btn variant="danger" className="p-2" onClick={() => deleteProduct(p.product_id)}>{Icon.trash}</Btn>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <Card className="text-center py-12">
                        <p className="text-4xl mb-3">📦</p>
                        <p style={{ color: t.textFaint }}>პროდუქტები არ არის. დაამატეთ პირველი!</p>
                    </Card>
                )}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={goTo} totalItems={totalItems} perPage={perPage} />
            </div>
            {modal === "product" && (
                <Modal title={editItem ? "პროდუქტის რედაქტირება" : "ახალი პროდუქტი"} onClose={() => setModal(null)}>
                    <Select label="კატეგორია" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">აირჩიეთ კატეგორია</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select label="ფერი / დეკორი" value={form.color_id} onChange={e => setForm({ ...form, color_id: e.target.value })}>
                        <option value="">აირჩიეთ ფერი</option>
                        {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Input label="სისქე" value={form.thickness} onChange={e => setForm({ ...form, thickness: e.target.value })} placeholder="18მმ" />
                    <Input label="აღწერა (სურვილისამებრ)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="დამატებითი ინფო..." />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="შეძენის ფასი (₾)" type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} placeholder="0.00" />
                        <Input label="გაყიდვის ფასი (₾)" type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="0.00" />
                    </div>
                    <Btn className="w-full justify-center mt-2" onClick={saveProduct}>{editItem ? "განახლება" : "დამატება"}</Btn>
                </Modal>
            )}
            {modal === "category" && (
                <Modal title="ახალი კატეგორია" onClose={() => setModal(null)}>
                    <Input label="კატეგორიის სახელი" value={newName} onChange={e => setNewName(e.target.value)} placeholder="მაგ: ლამინატი, MDF..." autoFocus />
                    <Btn className="w-full justify-center mt-2" onClick={saveCategory}>დამატება</Btn>
                </Modal>
            )}
            {modal === "color" && (
                <Modal title="ახალი ფერი / დეკორი" onClose={() => setModal(null)}>
                    <Input label="ფერის სახელი" value={newName} onChange={e => setNewName(e.target.value)} placeholder="მაგ: საფირმე, კაკალი..." autoFocus />
                    <Btn className="w-full justify-center mt-2" onClick={saveColor}>დამატება</Btn>
                </Modal>
            )}
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
