import { useState, useEffect } from 'react'
import type { Account, AccountCreate } from '@/types/ledger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

const ACCOUNT_TYPES = ['bank', 'cash', 'card'] as const

type AccountFormProps = {
  account?: Account | null
  onSubmit: (data: AccountCreate) => void
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
          onChange={(e) => setType(e.target.value)}
          required
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : account ? 'Save changes' : 'Add account'}
        </Button>
      </div>
    </form>
  )
}
