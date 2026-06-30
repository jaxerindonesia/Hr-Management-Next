/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { code: '1', name: 'Asset' },
    { code: '2', name: 'Liability' },
    { code: '3', name: 'Equity' },
    { code: '4', name: 'Revenue' },
    { code: '5', name: 'Expense' },
  ];

  const accountCategories = {};

  for (const category of categories) {
    const row = await prisma.accountCategory.upsert({
      where: { code: category.code },
      update: { name: category.name },
      create: category,
    });
    accountCategories[category.code] = row;
  }

  const accounts = [
    {
      code: '1101',
      name: 'Cash',
      normalBalance: 'DEBIT',
      categoryCode: '1',
    },
    {
      code: '1102',
      name: 'Bank',
      normalBalance: 'DEBIT',
      categoryCode: '1',
    },
    {
      code: '1201',
      name: 'Accounts Receivable',
      normalBalance: 'DEBIT',
      categoryCode: '1',
    },
    {
      code: '2101',
      name: 'Accounts Payable',
      normalBalance: 'CREDIT',
      categoryCode: '2',
    },
    {
      code: '3101',
      name: 'Capital',
      normalBalance: 'CREDIT',
      categoryCode: '3',
    },
    {
      code: '4101',
      name: 'Sales Revenue',
      normalBalance: 'CREDIT',
      categoryCode: '4',
    },
    {
      code: '5101',
      name: 'Salary Expense',
      normalBalance: 'DEBIT',
      categoryCode: '5',
    },
    {
      code: '5102',
      name: 'Office Expense',
      normalBalance: 'DEBIT',
      categoryCode: '5',
    },
  ];

  for (const account of accounts) {
    const existing = await prisma.account.findFirst({
      where: { tenantId: null, code: account.code },
    });

    const data = {
      code: account.code,
      name: account.name,
      normalBalance: account.normalBalance,
      isActive: true,
      accountCategoryId: accountCategories[account.categoryCode].id,
    };

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await prisma.account.create({ data });
  }

  console.log('Finance seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
