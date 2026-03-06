import React from 'react';

const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-purple-50 text-purple-700 border-purple-200',
    printed: 'bg-violet-50 text-violet-700 border-violet-200',
    ready_for_pickup: 'bg-orange-50 text-orange-700 border-orange-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const style = statusStyles[status] || 'bg-ink/5 text-ink/50 border-ink/10';

    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full font-mono text-[11.5px] uppercase tracking-wider border ${style}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export default StatusBadge;
