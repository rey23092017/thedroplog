import fs from 'fs';
import { parse } from 'csv-parse/sync';

// SVG Icons based on category_type
const getIcon = (type) => {
  if (type === 'smartphone') {
    return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="10" y1="19" x2="14" y2="19"/></svg>`;
  } else if (type === 'laptop') {
    return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="15" width="18" height="6" rx="2"/><path d="M4 15V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9"/></svg>`;
  } else if (type === 'watch') {
    return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/></svg>`;
  } else if (type === 'audio') {
    return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`;
  }
  // Default generic icon
  return `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
};

const getStamp = (status) => {
  if (status === 'preorder') return '<span class="stamp stamp--preorder">Pre-order</span>';
  if (status === 'tba') return '<span class="stamp stamp--tba">TBA</span>';
  return '<span class="stamp stamp--sale">On sale</span>';
};

const main = () => {
  const csvData = fs.readFileSync('data.csv', 'utf8');
  const records = parse(csvData, { columns: true, skip_empty_lines: true });

  let indexHtml = '';
  let entriesHtml = '';

  records.forEach((record, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    
    // Build Index Row
    indexHtml += `      <li><a href="#${record.id}"><span class="idx-num">${num}</span><span class="idx-name">${record.name}</span><span class="idx-leader"></span><span class="idx-price">${record.price}</span></a></li>\n`;

    // Build Spec Table
    let specHtml = '';
    for (let j = 1; j <= 6; j++) {
      const specName = record[`spec_${j}_name`];
      const specVal = record[`spec_${j}_value`];
      if (specName && specVal) {
        specHtml += `          <div><dt>${specName}</dt><dd>${specVal}</dd></div>\n`;
      }
    }

    // Build Entry
    entriesHtml += `
    <article class="entry" id="${record.id}">
      <div class="entry-head">
        ${getStamp(record.status)}
        <span class="entry-date">${record.date}</span>
        <span class="entry-cat">
          ${getIcon(record.category_type)}
          ${record.category_name}
        </span>
      </div>
      <h2 class="entry-name">${record.name}</h2>
      <p class="entry-blurb">${record.blurb}</p>
      <div class="entry-body">
        <dl class="spec-table">
${specHtml}        </dl>
        <div class="buy-box">
          <span class="price-label">Starts at</span>
          <span class="price">${record.price}</span>
          <span class="price-note">${record.price_note}</span>
          <a class="buy-btn" href="${record.amazon_link}&tag=raredeals013-21" target="_blank" rel="nofollow sponsored noopener" aria-label="View ${record.name} on Amazon">View on Amazon →</a>
        </div>
      </div>
    </article>
`;
  });

  const template = fs.readFileSync('template.html', 'utf8');
  const dateObj = new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  let finalHtml = template
    .replace('<!-- INDEX_GOES_HERE -->', indexHtml)
    .replace('<!-- ENTRIES_GOES_HERE -->', entriesHtml)
    .replace('<!-- LAST_UPDATED -->', dateStr)
    .replace('<!-- ENTRY_COUNT -->', records.length.toString().padStart(2, '0'));

  fs.writeFileSync('index.html', finalHtml, 'utf8');
  console.log(`Successfully built index.html with ${records.length} entries.`);
};

main();
