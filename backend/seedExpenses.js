// ============================================================
// MEMBER 2 (Pangta) — Seed script for expenses collection
// Uses actual users from your database
// Run: node seedExpenses.js
// ============================================================
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Your actual users from the database
const USERS = [
  { name: "Emily Yu", id: "69b8d46cdabbe49222af6a2a" },
  { name: "Eric Chen", id: "69b9d7f9f8a94844c74ab6cd" },
  { name: "Sam Yang", id: "69b9d80cf8a94844c74ab6ce" },
  { name: "willy", id: "69ba1d3d14e7d6dee682a1fa" },
];

const NAMES = USERS.map((u) => u.name);

const FOOD = [
  "Dinner at Mario's",
  "Sushi Takeout",
  "Pizza Night",
  "Brunch at Cafe",
  "Burrito Run",
  "Thai Food Delivery",
  "BBQ Night",
  "Ramen House",
  "Sandwich Shop",
  "Coffee & Pastries",
  "Poke Bowl",
  "Dim Sum Lunch",
];
const TRANSPORT = [
  "Uber to Downtown",
  "Lyft to Airport",
  "Gas Station",
  "Taxi Ride",
  "Parking Fee",
  "Bus Pass",
  "Train Ticket",
  "Toll Fee",
];
const UTILITIES = [
  "Electric Bill",
  "Water Bill",
  "Internet Bill",
  "Gas Bill",
  "Phone Plan Split",
  "Streaming Subscription",
];
const ENTERTAIN = [
  "Movie Night",
  "Concert Tickets",
  "Bowling Night",
  "Escape Room",
  "Mini Golf",
  "Game Night Snacks",
  "Karaoke",
];
const OTHER = [
  "Groceries",
  "Cleaning Supplies",
  "Toilet Paper",
  "Paper Towels",
  "First Aid Kit",
  "Sunscreen",
  "Batteries",
  "Laundry Detergent",
];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randAmt = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randDate = () => {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - 6);
  return new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime()),
  );
};

const descFor = (c) => {
  if (c === "food") return rand(FOOD);
  if (c === "transport") return rand(TRANSPORT);
  if (c === "utilities") return rand(UTILITIES);
  if (c === "entertainment") return rand(ENTERTAIN);
  return rand(OTHER);
};

const amtFor = (c) => {
  if (c === "food") return randAmt(10, 120);
  if (c === "transport") return randAmt(5, 80);
  if (c === "utilities") return randAmt(30, 200);
  if (c === "entertainment") return randAmt(10, 150);
  return randAmt(3, 50);
};

async function seedExpenses() {
  const client = new MongoClient(
    process.env.MONGODB_URI || process.env.MONGO_URI,
  );
  try {
    await client.connect();
    const db = client.db("spliteasy");

    // Only clear expenses collection (don't touch users, groups, groupExpenses)
    await db.collection("expenses").deleteMany({});
    console.log("Cleared expenses collection.");

    const expenses = [];
    const cats = ["food", "transport", "utilities", "entertainment", "other"];

    // Generate 1050+ single expenses
    for (let i = 0; i < 1050; i++) {
      const cat = rand(cats);
      const paidByUser = rand(USERS);
      const paidBy = paidByUser.name;
      const amount = amtFor(cat);

      // Random 2-4 participants (always includes payer)
      const others = NAMES.filter((n) => n !== paidBy);
      const shuffled = others.sort(() => Math.random() - 0.5);
      const numOthers =
        1 + Math.floor(Math.random() * Math.min(3, others.length));
      const splitBetween = [paidBy, ...shuffled.slice(0, numOthers)];

      // Calculate equal split
      const share = Math.round((amount / splitBetween.length) * 100) / 100;
      const splitDetails = {};
      const paidStatus = {};
      splitBetween.forEach((name) => {
        splitDetails[name] = share;
        // Payer is auto-paid, others have random paid status
        paidStatus[name] = name === paidBy || Math.random() > 0.5;
      });
      const settled = splitBetween.every((name) => paidStatus[name]);

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
    console.log(`Inserted ${expenses.length} expenses.`);

    // Print summary
    const perUser = {};
    NAMES.forEach((name) => {
      perUser[name] = expenses.filter((e) =>
        e.splitBetween.includes(name),
      ).length;
    });
    console.log("Expenses per user:");
    Object.entries(perUser).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} expenses`);
    });

    console.log("Seed complete!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await client.close();
  }
}

seedExpenses();
