import { postgres } from 'vite-plugin-db'

export default postgres({
  seed: {
    type: 'sql-script',
    path: 'db/init.sql',
  },
  referrer: 'https://github.com/vhnam/expense-ledger',
  dotEnvKey: 'DATABASE_URL',
})
