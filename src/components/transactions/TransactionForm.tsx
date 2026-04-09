import { useState, useEffect } from 'react'
import type { Transaction, TransactionType } from '@/types/ledger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense']

const transactionItems = TRANSACTION_TYPES.map((t) => ({
  label: t.charAt(0).toUpperCase() + t.slice(1),
  value: t,
}))

/** Normalize ISO date string to YYYY-MM-DD for date input */
function toDateInputValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** YYYY-MM-DD or full ISO to ISO string for API */
function toApiDate(value: string): string {
  if (!value.trim()) return ''
  if (value.length === 10) return `${value}T00:00:00.000Z`
  return value
}

type TransactionFormProps = {
  accountId: string
  transaction?: Transaction | null
  onSubmit: (data: {
    amount: string
    date: string
    description: string
    type: TransactionType
  }) => void
  onCancel: () => void
  isPending?: boolean
}

export function TransactionForm({
  accountId,
  transaction,
  onSubmit,
  onCancel,
  isPending = false,
}: TransactionFormProps) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TransactionType>('expense')

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount)
      setDate(toDateInputValue(transaction.date))
      setDescription(transaction.description)
      setType(transaction.type)
    } else {
      setAmount('')
      setDate(toDateInputValue(new Date().toISOString()))
      setDescription('')
      setType('expense')
    }
  }, [transaction, accountId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedAmount = amount.trim()
    const trimmedDate = date.trim()
    if (!trimmedAmount || !trimmedDate) return
    const num = Number(trimmedAmount)
    if (Number.isNaN(num)) return
    onSubmit({
      amount: trimmedAmount,
      date: toApiDate(trimmedDate),
      description: description.trim(),
      type,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="tx-amount">Amount</Label>
        <Input
          id="tx-amount"
          type="number"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tx-date">Date</Label>
        <Input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tx-type">Type</Label>
        <Select id="tx-type" value={type} onValueChange={(value) => setType(value as TransactionType)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {transactionItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tx-description">Description</Label>
        <Input
          id="tx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Saving…'
            : transaction
              ? 'Save changes'
              : 'Add transaction'}
        </Button>
      </div>
    </form>
  )
}
