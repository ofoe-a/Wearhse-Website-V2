import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { assignRider, fetchTeam } from '../services/adminApi';

interface RiderAssignModalProps {
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    customer: string;
    city: string;
    onClose: () => void;
    onAssigned: () => void;
}

interface Rider {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

const RiderAssignModal: React.FC<RiderAssignModalProps> = ({
    isOpen, orderId, orderNumber, customer, city, onClose, onAssigned,
}) => {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError('');
            setSelectedRiderId('');
            fetchTeam()
                .then((users: any[]) => {
                    const riderList = users.filter((u) => u.role === 'rider');
                    setRiders(riderList);
                    if (riderList.length > 0) setSelectedRiderId(riderList[0].id);
                })
                .catch(() => setError('Failed to load riders'))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleAssign = async () => {
        if (!selectedRiderId) { setError('Please select a rider'); return; }
        setAssigning(true);
        setError('');
        try {
            await assignRider(orderId, selectedRiderId);
            onAssigned();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to assign rider');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50">
            <div className="bg-[#f4f4f0] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]/8">
                    <h2 className="font-['Archivo_Black'] text-lg uppercase tracking-wide">Assign Rider</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#1a1a1a]/5 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Order Info */}
                    <div className="bg-white/60 rounded-xl p-4 space-y-1">
                        <p className="font-['Space_Mono'] text-[11px] uppercase text-[#1a1a1a]/35 tracking-wider">Order</p>
                        <p className="font-['Archivo_Black'] text-sm uppercase">{orderNumber}</p>
                        <p className="font-['Space_Mono'] text-sm text-[#1a1a1a]/60">{customer} &bull; {city}</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-[#1a1a1a]/30" />
                        </div>
                    ) : riders.length === 0 ? (
                        <div className="flex gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="font-['Space_Mono'] text-[12px] text-amber-700">No riders found. Add a rider from the Team page first.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block font-['Space_Mono'] text-[11px] uppercase text-[#1a1a1a]/35 tracking-wider mb-2">
                                    Select Rider
                                </label>
                                <select
                                    value={selectedRiderId}
                                    onChange={(e) => setSelectedRiderId(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-[#1a1a1a]/10 rounded-lg bg-white font-['Space_Mono'] text-sm focus:outline-none focus:border-[#1a1a1a]/30 transition-colors"
                                >
                                    {riders.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.firstName} {r.lastName} ({r.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                    <p className="font-['Space_Mono'] text-[12px] text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 border border-[#1a1a1a]/10 rounded-lg font-['Space_Mono'] text-sm hover:bg-[#1a1a1a]/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={assigning || !selectedRiderId}
                                    className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-[#f4f4f0] rounded-lg font-['Space_Mono'] text-sm hover:bg-[#1a1a1a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {assigning && <Loader2 size={14} className="animate-spin" />}
                                    Assign Rider
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderAssignModal;
