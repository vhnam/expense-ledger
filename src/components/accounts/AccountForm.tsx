import { useState, useEffect } from 'react'
import type {
  BankAccount,
  BankAccountCreate,
  BankAccountType,
} from '@/types/ledger'
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

const ACCOUNT_TYPES: BankAccountType[] = ['bank', 'cash', 'card']

const accountItems = ACCOUNT_TYPES.map((t) => ({
  label: t.charAt(0).toUpperCase() + t.slice(1),
  value: t,
}))

type AccountFormProps = {
  account?: BankAccount | null
  onSubmit: (data: BankAccountCreate) => void
  onCancel: () => void
  isPending?: boolean
}

export function AccountForm({
  account,
  onSubmit,
  onCancel,
  isPending = false,
}: AccountFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<string>(ACCOUNT_TYPES[0])

  useEffect(() => {
    if (account) {
      setName(account.name)
      setType(account.type)
    } else {
      setName('')
      setType(ACCOUNT_TYPES[0])
    }
  }, [account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedType = type.trim()
    if (!trimmedName || !trimmedType) return
    onSubmit({ name: trimmedName, type: trimmedType })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="account-name">Name</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main checking"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="account-type">Type</Label>
        <Select
          id="account-type"
          value={type}
          onValueChange={(value) => setType(value as BankAccountType)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {accountItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
          {isPending ? 'Saving…' : account ? 'Save changes' : 'Add account'}
        </Button>
      </div>
    </form>
  )
}
