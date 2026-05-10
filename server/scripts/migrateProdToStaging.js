/**
 * One-shot migration: copy `golfrounds` and `courseInfo` documents from a source
 * Mongo database (your existing prod) to a target database (your new staging).
 *
 * Usage (PowerShell):
 *   $env:MONGO_URI_SOURCE = 'mongodb+srv://.../golfStatsProd?...'
 *   $env:MONGO_URI_TARGET = 'mongodb+srv://.../golfStatsStaging?...'
 *   node scripts/migrateProdToStaging.js
 *
 * Optional flags:
 *   --dry-run     Count documents on both ends; do not write anything.
 *   --clear       Empty the target collections before inserting (idempotent re-runs).
 *   --collections golfrounds,courseinfo   Restrict which collections to copy (default: both).
 *
 * Examples:
 *   node scripts/migrateProdToStaging.js --dry-run
 *   node scripts/migrateProdToStaging.js --clear
 *   node scripts/migrateProdToStaging.js --collections golfrounds
 *
 * Safety:
 *   - The script never reads or modifies the source after the initial fetch.
 *   - Without --clear, re-runs would create duplicates in the target. Pass --clear
 *     to wipe-and-replace, or run --dry-run first to verify counts.
 *   - Run this from the `server/` directory so the relative model imports resolve.
 */

import mongoose from 'mongoose';
import GolfRoundsCollection from '../models/GolfRounds.js';
import CourseInfoCollection from '../models/CourseInfo.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clear = args.includes('--clear');

const collectionsArg = args.find(a => a.startsWith('--collections'));
const allowedCollections = ['golfrounds', 'courseinfo'];
let collectionsToMigrate = allowedCollections;
if (collectionsArg) {
    const value = collectionsArg.includes('=')
        ? collectionsArg.split('=')[1]
        : args[args.indexOf(collectionsArg) + 1];
    collectionsToMigrate = value.split(',').map(c => c.trim().toLowerCase());
    const invalid = collectionsToMigrate.filter(c => !allowedCollections.includes(c));
    if (invalid.length) {
        console.error(`Unknown collection(s): ${invalid.join(', ')}. Allowed: ${allowedCollections.join(', ')}`);
        process.exit(1);
    }
}

const SOURCE_URI = process.env.MONGO_URI_SOURCE;
const TARGET_URI = process.env.MONGO_URI_TARGET;

if (!SOURCE_URI || !TARGET_URI) {
    console.error('Missing MONGO_URI_SOURCE and/or MONGO_URI_TARGET environment variables.');
    console.error('Set them before running, e.g.:');
    console.error('  $env:MONGO_URI_SOURCE = "mongodb+srv://.../golfStatsProd"');
    console.error('  $env:MONGO_URI_TARGET = "mongodb+srv://.../golfStatsStaging"');
    process.exit(1);
}

if (SOURCE_URI === TARGET_URI) {
    console.error('SOURCE and TARGET URIs are identical. Refusing to migrate a database onto itself.');
    process.exit(1);
}

const collectionMap = {
    golfrounds: GolfRoundsCollection,
    courseinfo: CourseInfoCollection,
};

async function migrate() {
    console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : clear ? 'CLEAR + WRITE' : 'WRITE (additive)'}`);
    console.log(`Collections: ${collectionsToMigrate.join(', ')}`);
    console.log('');

    // --- Source ---
    console.log('Connecting to SOURCE...');
    const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log(`Source connected: ${sourceConn.name}`);

    // --- Target ---
    console.log('Connecting to TARGET...');
    const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
    console.log(`Target connected: ${targetConn.name}`);

    if (sourceConn.host === targetConn.host && sourceConn.name === targetConn.name) {
        console.error('SOURCE and TARGET resolve to the same host+database. Aborting.');
        await sourceConn.close();
        await targetConn.close();
        process.exit(1);
    }

    console.log('');

    for (const name of collectionsToMigrate) {
        const Model = collectionMap[name];
        const SourceModel = sourceConn.model(Model.modelName, Model.schema, Model.collection.collectionName);
        const TargetModel = targetConn.model(Model.modelName, Model.schema, Model.collection.collectionName);

        const sourceCount = await SourceModel.countDocuments();
        const targetCountBefore = await TargetModel.countDocuments();
        console.log(`[${name}] source: ${sourceCount} docs | target before: ${targetCountBefore} docs`);

        if (dryRun) continue;

        if (clear) {
            const deleted = await TargetModel.deleteMany({});
            console.log(`[${name}] cleared target (${deleted.deletedCount} docs removed)`);
        }

        if (sourceCount === 0) {
            console.log(`[${name}] nothing to copy`);
            continue;
        }

        const docs = await SourceModel.find({}).lean();
        // Strip _id so target generates fresh ones (avoids unique-index conflicts on re-runs without --clear).
        const cleaned = docs.map(({ _id, ...rest }) => rest);
        const inserted = await TargetModel.insertMany(cleaned, { ordered: false });
        const targetCountAfter = await TargetModel.countDocuments();
        console.log(`[${name}] inserted ${inserted.length} docs | target after: ${targetCountAfter}`);
    }

    console.log('');
    await sourceConn.close();
    await targetConn.close();
    console.log('Done. Both connections closed.');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
