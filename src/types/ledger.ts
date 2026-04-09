/**
 * Ledger types aligned with db/init.sql
 */

export interface BankAccount {
  id: string
  name: string
  type: string
}

export type BankAccountType = 'bank' | 'cash' | 'card'

export type BankAccountCreate = Pick<BankAccount, 'name' | 'type'>
export type BankAccountUpdate = Partial<BankAccountCreate>

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  account_id: string
  amount: string
  date: string
  description: string
  type: TransactionType
}

export type TransactionCreate = Pick<
  Transaction,
  'account_id' | 'amount' | 'date' | 'description' | 'type'
>
export type TransactionUpdate = Partial<
  Pick<Transaction, 'amount' | 'date' | 'description' | 'type'>
>
