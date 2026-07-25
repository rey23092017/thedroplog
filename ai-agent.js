import fs from 'fs';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  console.log('Fetching latest gadget news...');
  const feed = await parser.parseURL('https://gadgets360.com/rss/mobiles/feeds');
  
  // Get latest 15 articles
  const articles = feed.items.slice(0, 15).map(item => ({
    title: item.title,
    content: item.contentSnippet,
    link: item.link
  }));

  const existingCsv = fs.readFileSync('data.csv', 'utf8');

  console.log('Analyzing with Gemini AI...');
  const prompt = `
You are an expert gadget researcher for "The Drop Log", an Indian tech website.
Here is the current database of gadgets already on the website (CSV format):
---
${existingCsv}
---

Here are the latest 15 gadget news articles:
---
${JSON.stringify(articles, null, 2)}
---

Your task:
1. Find any NEW gadgets that have officially LAUNCHED in India in the news articles provided. 
2. Do not include gadgets that are already in the existing database.
3. Do not include rumors or global launches without Indian availability.
4. For any new gadget found, generate a valid CSV row matching EXACTLY this header format:
id,name,price,price_note,date,category_type,category_name,status,blurb,spec_1_name,spec_1_value,spec_2_name,spec_2_value,spec_3_name,spec_3_value,spec_4_name,spec_4_value,spec_5_name,spec_5_value,spec_6_name,spec_6_value,amazon_link

Rules for generating the CSV row:
- 'id': A URL-friendly slug (e.g., 'brand-model')
- 'category_type': One of: smartphone, laptop, watch, audio, tablet
- 'category_name': E.g., 'Smartphone — mid-range'
- 'status': 'sale', 'preorder', or 'tba'
- 'blurb': A 2-3 sentence punchy summary.
- Specs: Extract at least 4 key specs (e.g., Chip, Display, Battery, Camera).
- 'amazon_link': A generic amazon search link (e.g., 'https://www.amazon.in/s?k=Brand+Model')
- Output ONLY the raw CSV row(s), without the header, without markdown formatting (\`\`\`), and without any other text. If no new gadgets are found, output the exact word "NONE".
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const output = response.text.trim();
  
  if (output === 'NONE' || output === '') {
    console.log('No new gadgets found today. Sleeping...');
    return;
  }

  // Ensure it doesn't contain markdown blocks
  const cleanOutput = output.replace(/^```csv\n/, '').replace(/\n```$/, '');

  console.log('New gadgets found! Appending to database:');
  console.log(cleanOutput);
  
  fs.appendFileSync('data.csv', '\n' + cleanOutput);
  console.log('Successfully updated data.csv');
}

run().catch(console.error);
