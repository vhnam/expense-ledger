import { Link } from '@tanstack/react-router'
import type { BankAccount } from '@/types/ledger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { IconChevronRight, IconEdit, IconTrash } from '@tabler/icons-react'

type AccountRowProps = {
  account: BankAccount
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
}

export function AccountRow({ account, onEdit, onDelete }: AccountRowProps) {
  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <Link
        to="/account/$accountId"
        params={{ accountId: account.id }}
        className="block cursor-pointer rounded-t-xl transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`View transactions for ${account.name}`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-start justify-between gap-3">
            <span className="min-w-0 leading-snug">{account.name}</span>
            <IconChevronRight
              className="size-5 shrink-0 text-muted-foreground mt-0.5"
              stroke={1.75}
              aria-hidden
            />
          </CardTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {account.type}
          </p>
        </CardHeader>
      </Link>
      <CardFooter className="flex flex-wrap gap-2 pt-2 border-t border-border/60 bg-muted/20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(account)}
          aria-label={`Edit ${account.name}`}
          className="cursor-pointer"
        >
          <IconEdit className="size-4" aria-hidden />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(account)}
          aria-label={`Delete ${account.name}`}
          className="cursor-pointer"
        >
          <IconTrash className="size-4" aria-hidden />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
