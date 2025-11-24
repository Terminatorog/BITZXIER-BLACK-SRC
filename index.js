const wait = require('wait');
require('dotenv').config();
require('module-alias/register');
const path = require('path');
const ExcelPrime = require('./structures/Excel.js');

const client = new ExcelPrime();
const config = require(`${process.cwd()}/config.json`);

(async () => {
    try {
        console.log('Initializing Mongoose...');
        await client.initializeMongoose();
        console.log('Mongoose initialized successfully.');

        console.log('Initializing data...');
        await client.initializedata();
        console.log('Data initialized successfully.');

        console.log('Waiting for 3 seconds...');
        await wait(3000);
        console.log('Wait complete.');

        console.log('Loading events...');
        const events = await client.loadEvents();
        console.log(`Loaded events: ${events}`);

        console.log('Loading logs...');
        const logs = await client.loadlogs();
        console.log(`Loaded logs: ${logs}`);

        console.log('Loading main functionality...');
        await client.loadMain();
        console.log('Main functionality loaded.');

        console.log('Logging in the client...');
        await client.login(config.TOKEN);
        console.log('Client logged in successfully.');
    } catch (error) {
        console.error('An error occurred during initialization:', error);
    }
})();
