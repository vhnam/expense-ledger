import type { Transaction } from "@/types/ledger"

export function formatAmount(amount: string | number, type?: Transaction['type']): string {
    const n = Number(amount)
    if (Number.isNaN(n)) return amount.toString()
    const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(n))
    return type ? (type === 'income' ? `+${formatted}` : `−${formatted}`) : formatted
}

export function formatDate(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(d)
}