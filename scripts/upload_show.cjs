const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');

// Supabase配置
const SUPABASE_URL = 'https://aloutavuqwaqywwugdsm.supabase.co';
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

// 转换时间字符串为ISO格式
function convertTime(timeStr) {
  if (!timeStr) return null;
  // 格式: 2021-08-01 14:30:00
  const match = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
  }
  return null;
}

// 上传到Supabase
async function uploadToSupabase(data) {
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const uploadData = {
      show_time: convertTime(row.showtime),
      musical_id: row.musical_id || null,
      city: row.city || null,
      theater: row.theater || null,
      seat: row.seat || null,
      plot_score: row.plot_score ? parseInt(row.plot_score) : null,
      visual_score: row.visual_score ? parseInt(row.visual_score) : null,
      acting_score: row.acting_score ? parseInt(row.acting_score) : null,
      script_score: row.script_score ? parseInt(row.script_score) : null,
      singing_score: row.singing_score ? parseInt(row.singing_score) : null,
      note: row.note || null,
    };

    const postData = JSON.stringify(uploadData);

    await new Promise((resolve) => {
      const options = {
        hostname: 'aloutavuqwaqywwugdsm.supabase.co',
        port: 443,
        path: '/rest/v1/show',
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
            console.log(`✓ 成功: ${row.showtime} - ${row.theater}`);
            successCount++;
          } else {
            console.log(`✗ 失败: ${row.showtime} - ${res.statusCode} ${body}`);
            failCount++;
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.log(`✗ 错误: ${row.showtime} - ${e.message}`);
        failCount++;
        resolve();
      });

      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 50));
  }

  return { successCount, failCount };
}

async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\User\\Downloads\\show.csv';
  console.log('读取文件:', csvPath);

  // 使用GBK编码读取
  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, 'gbk');

  // 保存UTF-8版本
  const outputPath = csvPath.replace('.csv', '_utf8.csv');
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log('已保存UTF-8版本:', outputPath);

  const data = parseCSV(content);
  console.log(`读取到 ${data.length} 条记录\n`);

  // 预览前5条
  console.log('前5条数据预览:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.showtime} | ${row.city} | ${row.theater}`);
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
