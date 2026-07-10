const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');

const SUPABASE_ANON_KEY = 'sb_publishable_YXOlt6FwOh3i5cvLVkKHZg_mqiLb2on';

// 解析CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    data.push(row);
  }
  return data;
}

// 上传到Supabase
async function uploadToSupabase(data) {
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const uploadData = {
      show_id: row.show_id || null,
      artist_id: row.artist_id || null,
      actor_order: row.actor_order ? parseInt(row.actor_order) : null,
      actor_type: row.actor_type || null,
      role: row.role || null,
      review: row.review || null,
    };

    const postData = JSON.stringify(uploadData);

    await new Promise((resolve) => {
      const options = {
        hostname: 'aloutavuqwaqywwugdsm.supabase.co',
        port: 443,
        path: '/rest/v1/actor_review',
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Prefer': 'return=minimal',
          'Content-Length': Buffer.byteLength(postData, 'utf8')
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log(`✓ 成功: ${row.role || 'N/A'} - ${row.actor_type}`);
            successCount++;
          } else {
            console.log(`✗ 失败: ${row.role} - ${res.statusCode} ${body}`);
            failCount++;
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.log(`✗ 错误: ${row.role} - ${e.message}`);
        failCount++;
        resolve();
      });

      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 30));
  }

  return { successCount, failCount };
}

async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\User\\Downloads\\actor_review.csv';
  console.log('读取文件:', csvPath);

  const buffer = fs.readFileSync(csvPath);

  // 先尝试UTF-8，如果有乱码再用GBK
  let content = buffer.toString('utf-8');
  if (content.includes('�') || content.includes('�')) {
    content = iconv.decode(buffer, 'gbk');
    console.log('使用GBK编码');
  } else {
    console.log('使用UTF-8编码');
  }

  const data = parseCSV(content);
  console.log(`读取到 ${data.length} 条记录\n`);

  console.log('前5条数据预览:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.role} | ${row.actor_type} | ${row.review?.substring(0, 20)}...`);
  });

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  rl.question(`\n确认上传 ${data.length} 条记录到Supabase? (y/n): `, async (answer) => {
    if (answer.toLowerCase() === 'y') {
      const result = await uploadToSupabase(data);
      console.log(`\n上传完成: 成功 ${result.successCount} 条，失败 ${result.failCount} 条`);
    } else {
      console.log('已取消上传');
    }
    rl.close();
  });
}

main().catch(console.error);
