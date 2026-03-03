import { Link } from '@tanstack/react-router'
import type { Account } from '@/types/ledger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { IconEdit, IconTrash, IconList } from '@tabler/icons-react'

type AccountRowProps = {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountRow({ account, onEdit, onDelete }: AccountRowProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{account.name}</CardTitle>
        <p className="text-sm text-muted-foreground capitalize">
          {account.type}
        </p>
      </CardHeader>
      <CardContent className="pb-2" />
      <CardFooter className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          render={
            <Link to="/accounts/$accountId" params={{ accountId: account.id }}>
              <IconList className="size-4" />
              Transactions
            </Link>
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(account)}
          aria-label={`Edit ${account.name}`}
        >
          <IconEdit className="size-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(account)}
          aria-label={`Delete ${account.name}`}
        >
          <IconTrash className="size-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
