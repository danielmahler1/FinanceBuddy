import { prisma } from "./client";
import { faker } from "@faker-js/faker";

const NUM_USERS = 10;
const ACCOUNT_TYPES = ["checking", "savings", "credit"] as const;
const CURRENCIES = ["USD", "EUR", "GBP"] as const;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearAll() {
  await prisma.transaction.deleteMany();
  await prisma.recurringCharge.deleteMany();
  await prisma.income.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

async function seed() {
  try {
    console.log("Clearing existing data...");
    await clearAll();

    const users = [] as Array<{
      id: string;
      email: string;
    }>;

    for (let i = 0; i < NUM_USERS; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });

      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
        },
      });

      users.push({ id: user.id, email: user.email });
    }

    let totalAccounts = 0;
    let totalGoals = 0;
    let totalTransactions = 0;
    let totalRecurring = 0;
    let totalIncome = 0;

    for (const u of users) {
      const numAccounts = randInt(1, 3);
      totalAccounts += numAccounts;

      for (let a = 0; a < numAccounts; a++) {
        const accountType = faker.helpers.arrayElement(ACCOUNT_TYPES);
        const currency = faker.helpers.arrayElement(CURRENCIES);
  const value = faker.number.float({ min: 0, max: 20000, fractionDigits: 2 });

        const account = await prisma.account.create({
          data: {
            userId: u.id,
            accountType,
            value,
            currency,
          },
        });

        // Transactions
        const numTx = randInt(5, 15);
        let txSum = 0;
        totalTransactions += numTx;
        for (let t = 0; t < numTx; t++) {
          const dir = faker.helpers.arrayElement(["income", "expense"]);
          const rawAmt = faker.number.float({ min: 1, max: 2000, fractionDigits: 2 });
          const signedAmt = dir === "income" ? rawAmt : -rawAmt;
          await prisma.transaction.create({
            data: {
              accountId: account.id,
              type: dir,
              amount: signedAmt,
              vendor: faker.company.name(),
            },
          });
          txSum += signedAmt;
        }
        await prisma.account.update({
          where: { id: account.id },
          data: { value: value + txSum },
        });

        if (Math.random() < 0.4) {
          const numRecurring = randInt(1, 3);
          totalRecurring += numRecurring;
          for (let r = 0; r < numRecurring; r++) {
            await prisma.recurringCharge.create({
              data: {
                accountId: account.id,
                type: faker.helpers.arrayElement(["subscription", "utility", "membership"]),
                amount: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
                interval: faker.helpers.arrayElement(["monthly", "weekly", "yearly"]),
                endDate: Math.random() < 0.2 ? faker.date.soon({ days: 365 }) : null,
                status: Math.random() < 0.9,
              },
            });
          }
        }

        if (Math.random() < 0.5) {
          const numIncome = randInt(1, 2);
          totalIncome += numIncome;
          for (let inc = 0; inc < numIncome; inc++) {
            await prisma.income.create({
              data: {
                accountId: account.id,
                amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
                interval: Math.random() < 0.5 ? faker.helpers.arrayElement(["monthly", "weekly"]) : null,
                endDate: Math.random() < 0.2 ? faker.date.future({ years: 1 }) : null,
              },
            });
          }
        }
      }

      const numGoals = randInt(0, 3);
      totalGoals += numGoals;
      for (let g = 0; g < numGoals; g++) {
        await prisma.goal.create({
          data: {
            userId: u.id,
            name: faker.lorem.words(3),
            targetAmount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
            currentAmount: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
            status: faker.helpers.arrayElement(["active", "completed", "paused"]),
          },
        });
      }
    }

    console.log(`Seeded ${users.length} users, ${totalAccounts} accounts, ${totalGoals} goals, ${totalTransactions} transactions, ${totalRecurring} recurring charges, ${totalIncome} incomes`);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
