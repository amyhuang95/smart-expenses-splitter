import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const USERS = ["alex", "sarah", "david", "emily", "jordan", "taylor", "morgan", "casey", "riley"];
const FOOD = ["Dinner at Mario's", "Lunch with team", "Coffee run", "Sushi night", "Pizza split", "Brunch", "BBQ supplies", "Thai takeout"];
const TRANSPORT = ["Uber ride", "Lyft home", "Gas fill-up", "Taxi split", "Parking fee", "Train tickets"];
const UTILITIES = ["Electric bill", "Water bill", "WiFi/Internet", "Phone plan split", "Netflix subscription"];
const ENTERTAIN = ["Movie tickets", "Concert tickets", "Bowling night", "Escape room", "Board game night"];
const OTHER = ["Toilet paper", "Cleaning supplies", "Paper towels", "Birthday gift", "Office supplies"];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randAmt = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randDate = () => {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - 6);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

const descFor = (c) => {
  if (c === "food") return rand(FOOD);
  if (c === "transport") return rand(TRANSPORT);
  if (c === "utilities") return rand(UTILITIES);
  if (c === "entertainment") return rand(ENTERTAIN);
  return rand(OTHER);
};

const amtFor = (c) => {
  if (c === "food") return randAmt(8, 120);
  if (c === "transport") return randAmt(5, 60);
  if (c === "utilities") return randAmt(30, 200);
  if (c === "entertainment") return randAmt(10, 100);
  return randAmt(3, 50);
};

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("spliteasy");

    // Only clear YOUR collection, not Amy's
    await db.collection("expenses").deleteMany({});
    console.log("Cleared expenses collection.");

    const expenses = [];
    const cats = ["food", "transport", "utilities", "entertainment", "other"];

    // Generate 1000+ single expenses
    for (let i = 0; i < 1100; i++) {
      const cat = rand(cats);
      const paidBy = rand(USERS);

      // Random 2-5 people per expense (always includes payer)
      const numPeople = 2 + Math.floor(Math.random() * 4);
      const others = USERS.filter((u) => u !== paidBy);
      const shuffled = others.sort(() => Math.random() - 0.5);
      const splitBetween = [paidBy, ...shuffled.slice(0, numPeople - 1)];

      const amount = amtFor(cat);
      const share = Math.round((amount / splitBetween.length) * 100) / 100;

      const splitDetails = {};
      const paidStatus = {};
      splitBetween.forEach((u) => {
        splitDetails[u] = share;
        paidStatus[u] = u === paidBy || Math.random() > 0.5;
      });

      const settled = splitBetween.every((u) => paidStatus[u]);

      expenses.push({
        name: descFor(cat),
        description: "",
        amount,
        category: cat,
        paidBy,
        splitBetween,
        splitDetails,
        paidStatus,
        settled,
        createdBy: paidBy,
        dateCreated: randDate(),
      });
    }

    await db.collection("expenses").insertMany(expenses);
    console.log(`Inserted ${expenses.length} expenses into 'expenses' collection.`);
    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
