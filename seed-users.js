import sql from './db.js';

async function seedMultipleUsers() {
    console.log("Starting bulk user deployment script...");
    
    // 1. Automatically ensure 'Stor' and 'StorAdmin' locations exist to prevent Foreign Key errors
    try {
        await sql`
            INSERT INTO locations (location_name) VALUES ('Stor'), ('StorAdmin')
            ON CONFLICT (location_name) DO NOTHING
        `;
    } catch (e) {
        console.warn("Notice: Custom admin locations already initialized.");
    }

    // 2. Complete fully mapped dataset with individual roles included
    const usersToCreate = [
        { username: 'STOR', email: 'abu@moh.gov.my', locName: 'Stor', pass: 'stor@ePKPDKK', role: 'Warehouse' },
        { username: 'Calypso_Stor', email: 'inq@calypsocloud.one', locName: 'Stor', pass: 'stor@ePKPDKK', role: 'Warehouse' },
        { username: 'Admin', email: 'abu@moh.gov.my', locName: 'StorAdmin', pass: '@Clever1234', role: 'Admin' },
        { username: 'Calypso_KPH', email: 'inq@calypsocloud.one', locName: 'KPH', pass: 'kph@ePKPDKK', role: 'Clinic' },
        { username: 'KPKK', email: 'abu@moh.gov.my', locName: 'KPKK', pass: 'kpkk@ePKPDKK', role: 'Clinic' },
        { username: 'KPP', email: 'abu@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'KPPR', email: 'abu@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'KPSS', email: 'abu@moh.gov.my', locName: 'KPSS', pass: 'kpss@ePKPDKK', role: 'Clinic' },
        { username: 'KPM', email: 'abu@moh.gov.my', locName: 'KPM', pass: 'kpm@ePKPDKK', role: 'Clinic' },
        { username: 'DR SHARMILLA A/P MURAGAYA', email: 'dr.sharmilla@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'MUHD SYAFIQ MONGGIE BIN ABDULLAH', email: 'monggie1997@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'DR NAREEN A/L KUNASEGARAN', email: 'nareen.kuna@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'DR NUR SYIFFA ATHIRAH BINTI ABDUL RAHMAN', email: 'dr.syiffa@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'WAN SITI AMINAH BINTI WAN ISMAIL', email: 'sitijiji8@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'PARIDAH BINTI MAHZAN', email: 'paridahmahzan@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'MOHD AZLAN BIN MOHD ALI', email: 'azlan140485@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'IRWATUL HAZANI BINTI JAMIDIN', email: 'watulzani@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'NOOR FADZILLAH BINTI HAMZAH', email: 'dillah7377@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'NOR AZIAN BINTI MOHD HUSSEIN', email: 'azian_mh@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'MEOR AL HAFIZ BIN MEOR ABD HALIM', email: 'alhafizmeor@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'ZALELA BINTI HAMLI', email: 'zalelahamli156@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'NORHANIZA BINTI SANIMAN', email: 'anieqisya83@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'NOOR AZILINDA BINTI MOHAMAD YUSOP', email: 'noorazilinda@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'DR NURUL AINA SALMI BINTI RAMLEE', email: 'ainaramlee@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'AARON LAM WUI VUN', email: 'draaronlam@moh.gov.my', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'NURUL NADIA BINTI MAT NOOR', email: 'Nadiadieya65@gmail.com', locName: 'KPP', pass: 'kpp@ePKPDKK', role: 'Clinic' },
        { username: 'DR SURAYA HANI BINTI TAHAR', email: 'dr.surayahani@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'DR MOHD ABU UBAIDAH BIN MOHAMED ISMAIL', email: 'abu@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'DR NOR AAINA ADILAH BINTI MOHD NOR', email: 'aainaadilah@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'DR HAMIZAH BINTI MOHAMAD TARIDI', email: 'dr.hamizah@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'DR NOR SUHAIRA BINTI ZULKAFLEE', email: 'suhaira.zulkaflee@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'FAZIL HIDAYAT BIN MOHD HIZAT', email: 'fazil920528@gmail.com', locName: 'KPSS', pass: 'kpss@ePKPDKK', role: 'Clinic' },
        { username: 'SUZANA BINTI ABD RAHMAN', email: 'suzana201081@gmail.com', locName: 'KPKK', pass: 'kpkk@ePKPDKK', role: 'Clinic' },
        { username: 'NORISTILAH BINTI ISMAIL', email: 'noristilah@gmail.com', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'NOR SALWA BT PUTEH KHAZALI', email: 'salwa_puteh@moh.gov.my', locName: 'KPKK', pass: 'kpkk@ePKPDKK', role: 'Clinic' },
        { username: 'NORAIN NAZIHA BINTI KARIM', email: 'norainnaziha96@gmail.com', locName: 'KPSS', pass: 'kpss@ePKPDKK', role: 'Clinic' },
        { username: 'NOR ZARINA BINTI ABDUL AZIZ', email: 'norzarinaabdulaziz@gmail.com', locName: 'KPH', pass: 'kph@ePKPDKK', role: 'Clinic' },
        { username: 'ZARINA BINTI ZULKIFLI', email: 'zarinazul@moh.gov.my', locName: 'KPM', pass: 'kpm@ePKPDKK', role: 'Clinic' },
        { username: 'MUHAMMAD YUSOF BIN ABD KADIR', email: 'myusofakab@gmail.com', locName: 'KPKK', pass: 'kpkk@ePKPDKK', role: 'Clinic' },
        { username: 'RODZIAH BINTI MOHD AZIZ', email: 'aziemohdaziz93@gmail.com', locName: 'KPSS', pass: 'kpss@ePKPDKK', role: 'Clinic' },
        { username: 'MUHAMMAD NASIR BIN BlN DERAHMAN', email: 'nasirdcj@gmail.com', locName: 'KPM', pass: 'kpm@ePKPDKK', role: 'Clinic' },
        { username: 'RASHIDAH BINTI MOHD IBRAHIM', email: 'rashidah.mi@moh.gov.my', locName: 'KPH', pass: 'kph@ePKPDKK', role: 'Clinic' },
        { username: 'MOHD KAMAL BIN SABRON', email: 'mohd.kamal@moh.gov.my', locName: 'KPPR', pass: 'kppr@ePKPDKK', role: 'Clinic' },
        { username: 'DR MAISARAH', email: 'maisarah.ahmadkamil@moh.gov.my', locName: 'KPH', pass: 'kph@ePKPDKK', role: 'Clinic' }
    ];

    for (const u of usersToCreate) {
        try {
            // Find the location ID
            const [loc] = await sql`SELECT id FROM locations WHERE location_name = ${u.locName}`;
            if (!loc) {
                console.warn(`⚠️ Skipping ${u.username}: Location mapping for ${u.locName} not found.`);
                continue;
            }

            // Secure hash calculation
            const hash = await Bun.password.hash(u.pass, { algorithm: "bcrypt", cost: 10 });

            // 3. Dynamic role insertion instead of static 'Clinic' string
            await sql`
                INSERT INTO users (username, email, location_id, password_hash, role)
                VALUES (${u.username}, ${u.email}, ${loc.id}, ${hash}, ${u.role})
                ON CONFLICT (username) DO NOTHING
            `;
            console.log(`✅ User [${u.role}] ${u.username} created for ${u.locName}`);
        } catch (err) {
            console.error(`❌ Failed creating ${u.username}:`, err.message);
        }
    }
    console.log("Seeding complete!");
    process.exit(0);
}

seedMultipleUsers();