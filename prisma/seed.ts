/*
 * Prisma seed script for Shop4Me MVP.
 * Seeds a curated catalog based on PRD §11.2 (catalog ops) with
 * essential grocery and household items relevant to Lodwar.
 */

import { PrismaClient, Prisma } from "../src/generated/prisma";

const prisma = new PrismaClient();

const products: Array<{
  slug: string;
  name: string;
  category: string;
  price: Prisma.Decimal;
  unit?: string;
  priceNote?: string;
  imageUrl?: string;
}> = [
  {
    slug: "maize-flour-2kg",
    name: "Maize Flour (2kg)",
    category: "Staples",
    price: new Prisma.Decimal(250),
    unit: "2kg bag",
    priceNote: "Price may vary by ±10% depending on supplier.",
  },
  {
    slug: "rice-pishori-5kg",
    name: "Pishori Rice (5kg)",
    category: "Staples",
    price: new Prisma.Decimal(1580),
    unit: "5kg bag",
    priceNote: "Subject to market price swings.",
  },
  {
    slug: "cooking-oil-2l",
    name: "Cooking Oil (2L)",
    category: "Household",
    price: new Prisma.Decimal(720),
    unit: "2 litre",
    priceNote: "Brand may change for best value.",
  },
  {
    slug: "sugar-2kg",
    name: "Brown Sugar (2kg)",
    category: "Staples",
    price: new Prisma.Decimal(430),
    unit: "2kg pack",
  },
  {
    slug: "salt-1kg",
    name: "Iodized Salt (1kg)",
    category: "Staples",
    price: new Prisma.Decimal(65),
    unit: "1kg pack",
  },
  {
    slug: "tea-leaves-500g",
    name: "Tea Leaves (500g)",
    category: "Beverages",
    price: new Prisma.Decimal(380),
    unit: "500g pack",
  },
  {
    slug: "milk-longlife-500ml",
    name: "Long-Life Milk (500ml)",
    category: "Dairy",
    price: new Prisma.Decimal(95),
    unit: "500ml carton",
    priceNote: "Chilled stock limited; substitutes allowed.",
  },
  {
    slug: "bread-white-800g",
    name: "White Bread (800g)",
    category: "Bakery",
    price: new Prisma.Decimal(85),
    unit: "800g loaf",
  },
  {
    slug: "beef-1kg",
    name: "Fresh Beef (1kg)",
    category: "Butchery",
    price: new Prisma.Decimal(650),
    unit: "1kg",
    priceNote: "Price set after market check; substitution via WhatsApp.",
  },
  {
    slug: "charcoal-50kg",
    name: "Charcoal Sack (50kg)",
    category: "Fuel",
    price: new Prisma.Decimal(1650),
    unit: "50kg sack",
    priceNote: "Delivery fee excludes bulky handling surcharge.",
  },
  {
    slug: "custom-item",
    name: "Custom Item Request",
    category: "Custom",
    price: new Prisma.Decimal(0),
    unit: "as requested",
    priceNote: "Describe item, brand, and estimated price during checkout.",
  },
];

async function seedProducts() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit,
        priceNote: product.priceNote,
        imageUrl: product.imageUrl,
        isActive: true,
      },
      create: {
        ...product,
        currency: "KES",
      },
    });
  }
}

async function main() {
  await seedProducts();
  console.info(`Seeded ${products.length} products ✅`);
}

main()
  .catch((error) => {
    console.error("❌ Prisma seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
