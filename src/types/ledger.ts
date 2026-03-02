/**
 * Ledger types aligned with db/init.sql
 */

export interface Account {
  id: string
  name: string
  type: string
}

export type AccountCreate = Pick<Account, 'name' | 'type'>
export type AccountUpdate = Partial<AccountCreate>
