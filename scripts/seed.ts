/**
 * Seed script for local development
 * Run with: npx tsx scripts/seed.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function findLocalDatabase(): string | null {
  const wranglerDir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

  if (!fs.existsSync(wranglerDir)) {
    console.error('Wrangler D1 directory not found. Run "npm run db:migrate" first.');
    return null;
  }

  const files = fs.readdirSync(wranglerDir);
  const sqliteFile = files.find(f => f.endsWith('.sqlite'));

  if (!sqliteFile) {
    console.error('SQLite database not found. Run "npm run db:migrate" first.');
    return null;
  }

  return path.join(wranglerDir, sqliteFile);
}

function seed() {
  const dbPath = findLocalDatabase();
  if (!dbPath) {
    process.exit(1);
  }

  console.log('📂 Using database:', dbPath);

  const db = new Database(dbPath);

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  db.exec('DELETE FROM relationships');
  db.exec('DELETE FROM persons');
  db.exec('DELETE FROM trees');
  db.exec('DELETE FROM users');

  const now = Math.floor(Date.now() / 1000);
  const userId = 'dev-user-001';

  // Create dev user
  console.log('👤 Creating dev user...');
  db.prepare(`
    INSERT INTO users (id, email, name, locale, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, 'dev@example.com', 'Developer', 'ar', now, now);

  // Create family tree
  console.log('🌳 Creating family tree...');
  const treeId = 'tree-001';
  db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    treeId,
    userId,
    'عائلة الأحمد',
    'شجرة عائلة الأحمد - ثلاثة أجيال',
    1,
    now,
    now
  );

  // Create persons
  console.log('👥 Creating family members...');

  const persons = [
    // Generation 1 - Grandparents
    {
      id: 'p1',
      given_name: 'محمد',
      patronymic_chain: 'بن عبدالله بن سعيد',
      family_name: 'الأحمد',
      full_name_ar: 'محمد بن عبدالله بن سعيد الأحمد',
      full_name_en: 'Mohammed bin Abdullah bin Saeed Al-Ahmad',
      gender: 'male',
      birth_date: '1940-01-15',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      death_date: '2020-05-10',
      death_place: 'الرياض',
      is_living: 0,
      notes: 'الجد المؤسس للعائلة',
    },
    {
      id: 'p2',
      given_name: 'فاطمة',
      patronymic_chain: 'بنت حسن',
      family_name: 'العلي',
      full_name_ar: 'فاطمة بنت حسن العلي',
      full_name_en: 'Fatima bint Hassan Al-Ali',
      gender: 'female',
      birth_date: '1945-03-20',
      birth_place: 'جدة',
      birth_place_lat: 21.4858,
      birth_place_lng: 39.1925,
      is_living: 1,
      notes: 'الجدة',
    },
    // Generation 2 - Parents
    {
      id: 'p3',
      given_name: 'أحمد',
      patronymic_chain: 'بن محمد بن عبدالله',
      family_name: 'الأحمد',
      full_name_ar: 'أحمد بن محمد بن عبدالله الأحمد',
      full_name_en: 'Ahmad bin Mohammed bin Abdullah Al-Ahmad',
      gender: 'male',
      birth_date: '1970-07-12',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: 1,
      notes: 'الابن الأكبر',
    },
    {
      id: 'p4',
      given_name: 'نور',
      patronymic_chain: 'بنت علي',
      family_name: 'الحسن',
      full_name_ar: 'نور بنت علي الحسن',
      full_name_en: 'Nour bint Ali Al-Hassan',
      gender: 'female',
      birth_date: '1975-11-05',
      birth_place: 'الدمام',
      birth_place_lat: 26.4207,
      birth_place_lng: 50.0888,
      is_living: 1,
      notes: 'زوجة أحمد',
    },
    {
      id: 'p5',
      given_name: 'عبدالله',
      patronymic_chain: 'بن محمد بن عبدالله',
      family_name: 'الأحمد',
      full_name_ar: 'عبدالله بن محمد بن عبدالله الأحمد',
      full_name_en: 'Abdullah bin Mohammed bin Abdullah Al-Ahmad',
      gender: 'male',
      birth_date: '1973-02-28',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: 1,
      notes: 'الابن الثاني',
    },
    // Generation 3 - Grandchildren
    {
      id: 'p6',
      given_name: 'خالد',
      patronymic_chain: 'بن أحمد بن محمد',
      family_name: 'الأحمد',
      full_name_ar: 'خالد بن أحمد بن محمد الأحمد',
      full_name_en: 'Khaled bin Ahmad bin Mohammed Al-Ahmad',
      gender: 'male',
      birth_date: '2000-02-28',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: 1,
      notes: 'حفيد - ابن أحمد',
    },
    {
      id: 'p7',
      given_name: 'سارة',
      patronymic_chain: 'بنت أحمد بن محمد',
      family_name: 'الأحمد',
      full_name_ar: 'سارة بنت أحمد بن محمد الأحمد',
      full_name_en: 'Sara bint Ahmad bin Mohammed Al-Ahmad',
      gender: 'female',
      birth_date: '2003-09-15',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: 1,
      notes: 'حفيدة - بنت أحمد',
    },
    {
      id: 'p8',
      given_name: 'ريم',
      patronymic_chain: 'بنت أحمد بن محمد',
      family_name: 'الأحمد',
      full_name_ar: 'ريم بنت أحمد بن محمد الأحمد',
      full_name_en: 'Reem bint Ahmad bin Mohammed Al-Ahmad',
      gender: 'female',
      birth_date: '2006-04-10',
      birth_place: 'الرياض',
      birth_place_lat: 24.7136,
      birth_place_lng: 46.6753,
      is_living: 1,
      notes: 'حفيدة - بنت أحمد الصغرى',
    },
  ];

  const insertPerson = db.prepare(`
    INSERT INTO persons (
      id, tree_id, given_name, patronymic_chain, family_name,
      full_name_ar, full_name_en, gender,
      birth_date, birth_place, birth_place_lat, birth_place_lng,
      death_date, death_place, death_place_lat, death_place_lng,
      is_living, photo_url, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const person of persons) {
    insertPerson.run(
      person.id,
      treeId,
      person.given_name,
      person.patronymic_chain || null,
      person.family_name || null,
      person.full_name_ar || null,
      person.full_name_en || null,
      person.gender,
      person.birth_date || null,
      person.birth_place || null,
      person.birth_place_lat || null,
      person.birth_place_lng || null,
      person.death_date || null,
      person.death_place || null,
      null,
      null,
      person.is_living ?? 1,
      null,
      person.notes || null,
      now,
      now
    );
    console.log(`  ✓ ${person.full_name_ar}`);
  }

  // Create relationships
  console.log('💑 Creating relationships...');

  const relationships = [
    // Spouse relationships
    { id: 'r1', person1_id: 'p1', person2_id: 'p2', type: 'spouse', marriage_date: '1965-06-15', marriage_place: 'الرياض' },
    { id: 'r2', person1_id: 'p3', person2_id: 'p4', type: 'spouse', marriage_date: '1998-04-20', marriage_place: 'الرياض' },

    // Parent-child relationships
    { id: 'r3', person1_id: 'p1', person2_id: 'p3', type: 'parent' }, // Mohammed is parent of Ahmad
    { id: 'r4', person1_id: 'p2', person2_id: 'p3', type: 'parent' }, // Fatima is parent of Ahmad
    { id: 'r5', person1_id: 'p1', person2_id: 'p5', type: 'parent' }, // Mohammed is parent of Abdullah
    { id: 'r6', person1_id: 'p2', person2_id: 'p5', type: 'parent' }, // Fatima is parent of Abdullah

    { id: 'r7', person1_id: 'p3', person2_id: 'p6', type: 'parent' }, // Ahmad is parent of Khaled
    { id: 'r8', person1_id: 'p4', person2_id: 'p6', type: 'parent' }, // Nour is parent of Khaled
    { id: 'r9', person1_id: 'p3', person2_id: 'p7', type: 'parent' }, // Ahmad is parent of Sara
    { id: 'r10', person1_id: 'p4', person2_id: 'p7', type: 'parent' }, // Nour is parent of Sara
    { id: 'r11', person1_id: 'p3', person2_id: 'p8', type: 'parent' }, // Ahmad is parent of Reem
    { id: 'r12', person1_id: 'p4', person2_id: 'p8', type: 'parent' }, // Nour is parent of Reem

    // Sibling relationships
    { id: 'r13', person1_id: 'p3', person2_id: 'p5', type: 'sibling' }, // Ahmad and Abdullah are siblings
    { id: 'r14', person1_id: 'p6', person2_id: 'p7', type: 'sibling' }, // Khaled and Sara are siblings
    { id: 'r15', person1_id: 'p7', person2_id: 'p8', type: 'sibling' }, // Sara and Reem are siblings
    { id: 'r16', person1_id: 'p6', person2_id: 'p8', type: 'sibling' }, // Khaled and Reem are siblings
  ];

  const insertRelationship = db.prepare(`
    INSERT INTO relationships (
      id, tree_id, person1_id, person2_id, relationship_type,
      marriage_date, marriage_place, divorce_date, divorce_place, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const rel of relationships) {
    insertRelationship.run(
      rel.id,
      treeId,
      rel.person1_id,
      rel.person2_id,
      rel.type,
      rel.marriage_date || null,
      rel.marriage_place || null,
      null,
      null,
      now
    );
  }
  console.log(`  ✓ Created ${relationships.length} relationships`);

  // Create a second tree for variety
  console.log('🌳 Creating second family tree...');
  const treeId2 = 'tree-002';
  db.prepare(`
    INSERT INTO trees (id, user_id, name, description, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    treeId2,
    userId,
    'عائلة الحسن',
    'شجرة عائلة الحسن',
    0,
    now,
    now
  );

  // Add some persons to the second tree
  const persons2 = [
    {
      id: 'p20',
      given_name: 'حسن',
      patronymic_chain: 'بن علي',
      family_name: 'الحسن',
      full_name_ar: 'حسن بن علي الحسن',
      full_name_en: 'Hassan bin Ali Al-Hassan',
      gender: 'male',
      birth_date: '1955-08-20',
      is_living: 1,
    },
    {
      id: 'p21',
      given_name: 'مريم',
      patronymic_chain: 'بنت سعيد',
      family_name: 'القحطاني',
      full_name_ar: 'مريم بنت سعيد القحطاني',
      full_name_en: 'Mariam bint Saeed Al-Qahtani',
      gender: 'female',
      birth_date: '1960-12-05',
      is_living: 1,
    },
  ];

  for (const person of persons2) {
    insertPerson.run(
      person.id,
      treeId2,
      person.given_name,
      person.patronymic_chain || null,
      person.family_name || null,
      person.full_name_ar || null,
      person.full_name_en || null,
      person.gender,
      person.birth_date || null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      person.is_living ?? 1,
      null,
      null,
      now,
      now
    );
  }

  insertRelationship.run(
    'r20',
    treeId2,
    'p20',
    'p21',
    'spouse',
    '1980-03-15',
    'المدينة المنورة',
    null,
    null,
    now
  );

  db.close();

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 1 user');
  console.log('   - 2 family trees');
  console.log(`   - ${persons.length + persons2.length} persons`);
  console.log(`   - ${relationships.length + 1} relationships`);
  console.log('');
}

seed();
