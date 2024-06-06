import puppeteer from 'puppeteer';
import { MongoClient } from 'mongodb';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();



const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'twitter_trends';
const collectionName = 'trends';
const twitterUrl = 'https://twitter.com/login';
const proxyUrl = process.env.PROXY_URL;

const username = process.env.TWITTER_USERNAME;
const password = process.env.TWITTER_PASSWORD;


async function fetchIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}

async function fetchTrendingTopics() {
    const browser = await puppeteer.launch({
        args: [`--proxy-server=${proxyUrl}`, '--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto(twitterUrl, { waitUntil: 'networkidle2' });

        await page.type('input[name="session[username_or_email]"]', username);
        await page.type('input[name="session[password]"]', password);
        await page.click('div[data-testid="LoginForm_Login_Button"]');
        await page.waitForNavigation();

        await page.waitForSelector('section[aria-labelledby="accessible-list-0"]');
        const trendingTopics = await page.evaluate(() => {
            const trends = Array.from(document.querySelectorAll('section[aria-labelledby="accessible-list-0"] span'))
                .filter(span => span.innerText.includes('Trending'))
                .map(span => span.innerText);
            return trends.slice(0, 5);
        });

        const ipAddress = await fetchIP();
        const uniqueId = uuid();
        const timestamp = new Date().toISOString();

        console.log('Timestamp:', timestamp);
        console.log('IP Address:', ipAddress);

        const record = {
            _id: uniqueId,
            trend1: trendingTopics[0] || null,
            trend2: trendingTopics[1] || null,
            trend3: trendingTopics[2] || null,
            trend4: trendingTopics[3] || null,
            trend5: trendingTopics[4] || null,
            timestamp,
            ipAddress
        };

        const client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.insertOne(record);

        await client.close();
        await browser.close();

        return record;
    } catch (error) {
        // Catch any errors and return as part of the response
        return { error: error.message };
    }
}

export default fetchTrendingTopics;
