const fs = require('fs');
const path = require('path');
const https = require('https');

// Supabase配置
const SUPABASE_URL = 'https://aloutavuqwaqywwugdsm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YXOlt6FwOh3i5cvLVkKHZg_mqiLb2on';

// 类型映射
const TYPE_MAP = {
  '话剧': '话剧',
  '中国音乐剧': '中国音乐剧',
  '非中音乐剧': '非中音乐剧',
  '舞剧': '舞剧',
};

// 解析CSV（处理引号内的逗号和换行）
function parseCSV(content) {
  const lines = content.split('\n');
  const result = [];
  const headers = [];
  let currentRow = [];
  let inQuotes = false;
  let currentField = '';

  // 解析表头
  const headerLine = lines[0];
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(currentField.trim());
      currentField = '';
    } else if (char !== '\r') {
      currentField += char;
    }
  }
  headers.push(currentField.trim());

  // 解析数据行
  inQuotes = false;
  currentField = '';
  currentRow = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line.trim() && !inQuotes) continue;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char !== '\r') {
        currentField += char;
      }
    }

    // 行结束但不在引号内，完成这一行
    if (!inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';

      if (currentRow.length === headers.length) {
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = currentRow[idx] || '';
        });
        result.push(row);
      }
      currentRow = [];
    } else {
      // 在引号内，添加换行符继续
      currentField += '\n';
    }
  }

  return result;
}

// 尝试不同编码读取
function readCSVWithEncoding(filePath) {
  const iconv = require('iconv-lite');
  const buffer = fs.readFileSync(filePath);

  // 尝试不同编码
  const encodings = ['gbk', 'gb18030', 'gb2312', 'utf-8'];

  for (const enc of encodings) {
    try {
      const content = iconv.decode(buffer, enc);
      // 检查是否有乱码特征
      if (!content.includes('�') && content.includes('name')) {
        console.log(`成功使用 ${enc} 编码读取文件`);
        return { content, encoding: enc };
      }
    } catch (e) {
      console.log(`${enc} 编码失败: ${e.message}`);
    }
  }

  // 默认返回gbk
  return { content: iconv.decode(buffer, 'gbk'), encoding: 'gbk' };
}

// 上传到Supabase
async function uploadToSupabase(data) {
  let successCount = 0;
  let failCount = 0;

  for (const row of data) {
    const name = (row.name || '').trim();
    if (!name) continue;

    const uploadData = {
      name: name,
      type: TYPE_MAP[(row.type || '').trim()] || '话剧',
      brand: (row.brand || '').trim() || null,
      plot: (row.plot || '').trim() || null,
    };

    try {
      await new Promise((resolve, reject) => {
        const postData = JSON.stringify(uploadData);

        const options = {
          hostname: 'aloutavuqwaqywwugdsm.supabase.co',
          port: 443,
          path: '/rest/v1/musical',
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
              resolve();
            } else {
              console.log(`✗ 失败: ${name} - ${res.statusCode} ${body}`);
              failCount++;
              resolve();
            }
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

      // 添加小延迟避免请求过快
      await new Promise(r => setTimeout(r, 100));

    } catch (e) {
      console.log(`✗ 异常: ${name} - ${e.message}`);
      failCount++;
    }
  }

  return { successCount, failCount };
}

// 主函数
async function main() {
  const csvPath = process.argv[2] || 'C:\\Users\\User\\Downloads\\musical.csv';

  console.log('读取文件:', csvPath);

  // 检查iconv-lite是否安装
  try {
    require.resolve('iconv-lite');
  } catch (e) {
    console.log('安装 iconv-lite...');
    require('child_process').execSync('npm install iconv-lite', { cwd: __dirname, stdio: 'inherit' });
  }

  const { content, encoding } = readCSVWithEncoding(csvPath);

  // 先保存转换后的UTF-8版本
  const outputPath = csvPath.replace('.csv', '_utf8.csv');
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`已保存UTF-8版本到: ${outputPath}`);

  // 解析CSV
  const data = parseCSV(content);
  console.log(`\n读取到 ${data.length} 条记录`);

  // 显示预览
  console.log('\n前5条数据预览:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.name} | ${row.type} | ${row.brand}`);
  });

  // 上传
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

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
