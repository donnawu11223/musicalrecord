const fs = require('fs');
const https = require('https');
const iconv = require('iconv-lite');

// Supabase配置
const SUPABASE_URL = 'https://aloutavuqwaqywwugdsm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YXOlt6FwOh3i5cvLVkKHZg_mqiLb2on';

// 读取GBK编码的CSV
function readCSV(filePath) {
  const buffer = fs.readFileSync(filePath);
  const content = iconv.decode(buffer, 'gbk');
  const lines = content.split('\n').filter(l => l.trim());

  // 跳过表头
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const name = lines[i].trim();
    if (name) {
      data.push({ name });
    }
  }
  return data;
}

// 上传到Supabase
async function uploadToSupabase(data) {
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const name = row.name.trim();
    if (!name) continue;

    const postData = JSON.stringify({ name });

    await new Promise((resolve) => {
      const options = {
        hostname: 'aloutavuqwaqywwugdsm.supabase.co',
        port: 443,
        path: '/rest/v1/artist',
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
            console.log(`✓ 成功: ${name}`);
            successCount++;
          } else {
            console.log(`✗ 失败: ${name} - ${res.statusCode} ${body}`);
            failCount++;
          }
          resolve();
        });
      });

      req.on('error', (e) => {
        console.log(`✗ 错误: ${name} - ${e.message}`);
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
  const csvPath = process.argv[2] || 'C:\\Users\\User\\Downloads\\artist.csv';
  console.log('读取文件:', csvPath);

  const data = readCSV(csvPath);
  console.log(`读取到 ${data.length} 条记录\n`);

  // 预览前10条
  console.log('前10条数据预览:');
  data.slice(0, 10).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.name}`);
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
