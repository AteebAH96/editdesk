/**
 * Seed script: wipes the database and creates demo data.
 *
 *   npm run seed
 *
 * Creates:
 *   - admin@editdesk.local / changeme123   (role: admin)
 *   - client@editdesk.local / client123    (role: client)
 *   - 3 sample orders in different pipeline stages, plus messages.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Order = require('./models/Order');
const Message = require('./models/Message');

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await connectDB();

  await Message.deleteMany({});
  await Order.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared existing data');

  const admin = await User.create({
    name: 'EditDesk Admin',
    email: 'admin@editdesk.local',
    passwordHash: await bcrypt.hash('changeme123', 12),
    role: 'admin',
  });

  const client = await User.create({
    name: 'Demo Client',
    email: 'client@editdesk.local',
    passwordHash: await bcrypt.hash('client123', 12),
    role: 'client',
  });

  const order1 = await Order.create({
    title: 'Summer campaign promo — 30s cut',
    type: 'promo',
    description:
      'Fast-paced 30 second promo for the summer sale. Brand colors are teal and orange; logo sting at the end. Raw footage link below.',
    referenceLinks: ['https://drive.google.com/drive/folders/demo-brief-1'],
    deadline: daysFromNow(10),
    status: 'In Progress',
    client: client._id,
  });

  const order2 = await Order.create({
    title: 'Founder story — cinematic edit',
    type: 'cinematic',
    description:
      '5 minute founder interview, documentary style. Needs color grade, licensed music, and burned-in captions.',
    referenceLinks: [],
    deadline: daysFromNow(4),
    status: 'In Review',
    client: client._id,
  });

  const order3 = await Order.create({
    title: 'Product launch TikToks (x3)',
    type: 'tiktok',
    description: 'Three 20-second vertical cuts from the launch livestream.',
    referenceLinks: [],
    deadline: daysFromNow(-2),
    status: 'Delivered',
    deliveryUrl: 'https://drive.google.com/drive/folders/demo-delivery-1',
    client: client._id,
  });

  await Message.create([
    {
      order: order1._id,
      author: client._id,
      text: 'Hi! Brief and footage are linked above. The sale starts on the 20th, so I need the final cut a couple of days before.',
    },
    {
      order: order1._id,
      author: admin._id,
      text: 'Got it — first cut will be ready by Friday for your review.',
    },
    {
      order: order2._id,
      author: admin._id,
      text: 'Rough cut is done and the order is marked In Review. Take a look and tell me what to change.',
    },
    {
      order: order3._id,
      author: admin._id,
      text: 'All three TikToks are delivered — download links are in the delivery section above.',
    },
  ]);

  console.log('Seeded:');
  console.log('  admin  admin@editdesk.local / changeme123');
  console.log('  client client@editdesk.local / client123');
  console.log('  3 orders + 4 messages');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
