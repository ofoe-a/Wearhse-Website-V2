import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, MapPin, X, Check } from 'lucide-react';
import {
    fetchShippingZones,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
} from './services/adminApi';

interface ShippingZone {
    id: string;
    name: string;
    label: string;
    description: string | null;
    costPesewas: number;
    active: boolean;
    sortOrder: number;
}

interface ZoneFormData {
    name: string;
    label: string;
    description: string;
    costGHS: string;
    sortOrder: string;
}

const emptyForm: ZoneFormData = {
    name: '',
    label: '',
    description: '',
    costGHS: '0',
    sortOrder: '0',
};

const ShippingZonesPage: React.FC = () => {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ZoneFormData>(emptyForm);

    const load = async () => {
        try {
            const data = await fetchShippingZones();
            setZones(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setError(null);
    };

    const openEdit = (zone: ShippingZone) => {
        setForm({
            name: zone.name,
            label: zone.label,
            description: zone.description || '',
            costGHS: String(zone.costPesewas / 100),
            sortOrder: String(zone.sortOrder),
        });
        setEditingId(zone.id);
        setShowForm(true);
        setError(null);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.label.trim()) {
            setError('Name and label are required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const costPesewas = Math.round(parseFloat(form.costGHS || '0') * 100);
            const sortOrder = parseInt(form.sortOrder || '0', 10);

            if (editingId) {
                await updateShippingZone(editingId, {
                    label: form.label,
                    description: form.description || undefined,
                    costPesewas,
                    sortOrder,
                });
            } else {
                await createShippingZone({
                    name: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    label: form.label,
                    description: form.description || undefined,
                    costPesewas,
                    sortOrder,
                });
            }

            setShowForm(false);
            setEditingId(null);
            await load();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (zone: ShippingZone) => {
        try {
            await updateShippingZone(zone.id, { active: !zone.active });
            await load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (zone: ShippingZone) => {
        if (!confirm(`Delete "${zone.label}"? This cannot be undone.`)) return;
        try {
            await deleteShippingZone(zone.id);
            await load();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-ink/30" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-display uppercase tracking-tight">Shipping Zones</h1>
                    <p className="font-mono text-[13.5px] text-ink/40 mt-1">
                        Manage delivery areas and pricing shown at checkout
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-ink text-bone rounded-lg font-mono text-sm hover:bg-ink/85 transition-colors"
                >
                    <Plus size={16} />
                    Add Zone
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                    <p className="font-mono text-[13.5px] text-red-600">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Create / Edit Form */}
            {showForm && (
                <div className="mb-8 border border-ink/10 rounded-xl p-6 bg-white/40">
                    <h3 className="font-mono text-sm font-medium mb-4">
                        {editingId ? 'Edit Zone' : 'New Zone'}
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-1">
                                    Name (slug) *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    disabled={!!editingId}
                                    placeholder="e.g. accra"
                                    className="w-full bg-transparent border border-ink/15 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/40 disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-1">
                                    Label *
                                </label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                    placeholder="e.g. Within Accra"
                                    className="w-full bg-transparent border border-ink/15 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/40"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-1">
                                Description
                            </label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="e.g. East Legon, Airport, Cantonments..."
                                className="w-full bg-transparent border border-ink/15 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/40"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-1">
                                    Cost (GHS)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.costGHS}
                                    onChange={e => setForm(f => ({ ...f, costGHS: e.target.value }))}
                                    className="w-full bg-transparent border border-ink/15 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/40"
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-[11.5px] text-ink/40 uppercase tracking-wider mb-1">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.sortOrder}
                                    onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                                    className="w-full bg-transparent border border-ink/15 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-ink/40"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-ink text-bone rounded-lg font-mono text-sm hover:bg-ink/85 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                {editingId ? 'Save Changes' : 'Create Zone'}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-5 py-2.5 border border-ink/15 rounded-lg font-mono text-sm text-ink/50 hover:text-ink hover:border-ink/30 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zones List */}
            {zones.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-ink/15 rounded-xl">
                    <MapPin size={32} className="mx-auto text-ink/15 mb-3" />
                    <p className="font-mono text-sm text-ink/40">No shipping zones yet</p>
                    <p className="font-mono text-[11.5px] text-ink/25 mt-1">Click "Add Zone" to create your first delivery area</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {zones.map(zone => (
                        <div
                            key={zone.id}
                            className={`border rounded-xl p-5 transition-colors ${
                                zone.active ? 'border-ink/10 bg-white/40' : 'border-ink/5 bg-ink/[0.02] opacity-60'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="font-mono text-sm font-medium">{zone.label}</h3>
                                        <span className="font-mono text-[11.5px] text-ink/25 bg-ink/[0.04] px-2 py-0.5 rounded">
                                            {zone.name}
                                        </span>
                                        {!zone.active && (
                                            <span className="font-mono text-[11.5px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    {zone.description && (
                                        <p className="font-mono text-[12.5px] text-ink/35 mt-1 leading-relaxed">
                                            {zone.description}
                                        </p>
                                    )}
                                    <p className="font-mono text-sm font-medium mt-2">
                                        {zone.costPesewas === 0 ? 'Free delivery' : `GHS ${(zone.costPesewas / 100).toLocaleString()}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleToggle(zone)}
                                        className={`px-3 py-1.5 rounded-lg font-mono text-[11.5px] transition-colors ${
                                            zone.active
                                                ? 'text-amber-600 hover:bg-amber-50'
                                                : 'text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                    >
                                        {zone.active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => openEdit(zone)}
                                        className="p-2 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/[0.04] transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone)}
                                        className="p-2 rounded-lg text-ink/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShippingZonesPage;
