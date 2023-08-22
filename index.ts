import * as fs from 'fs';
import { MongoClient } from 'mongodb';
import config from './config';

async function backupDb() {

    const dbURL = config.dbURL
    const dbName = config.dbName
    const backupPath = config.backupPath

    const client = new MongoClient(dbURL);

    try {
        await client.connect();

        const db = client.db(dbName);
        const backup = new Date().toISOString().replace(/:/g, "-");
        const backupFile = `${backupPath}/${backup}`;

        if (!fs.existsSync(backupFile)) {
            fs.mkdirSync(backupFile, { recursive: true });
        }

        const collections = await db.collections();

        for (const collection of collections) {
            const data = await collection.find().toArray();
            const collectionName = `${backupFile}/${collection.collectionName}.json`;
            fs.writeFileSync(collectionName, JSON.stringify(data, null, 2));
            console.log(`Backup ${collection.collectionName} collection`);
        }
        console.log(`Backup completed: ${backupFile}`);


        const backupFileZip = fs.readdirSync(backupFile);

        const currentPath = backup.slice(0, 10);

        for (const file of backupFileZip) {
            if (file.startsWith(currentPath) && file !== backup) {
                fs.unlinkSync(`${backupFile}/${file}`);
                console.log(`Delete ${file}`);
            }
        }


    } catch (error) {
        console.error('Error during the backup process', error);
    } finally {
        await client.close();
    }

}

backupDb();

const backupInterval = 11 * 60 *60 *1000; // 11 hour in milliseconds
setInterval(backupDb, backupInterval);



