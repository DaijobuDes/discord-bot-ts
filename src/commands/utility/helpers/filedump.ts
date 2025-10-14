import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export function syncWriteFile(filename: string, data: any) {
  const filepath = join(__dirname, filename);

  let content: string;

  if (typeof data === 'object' || typeof data === 'bigint') {
    content = JSON.stringify(
      data,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2 // pretty print with indentation
    );
  } else {
    content = String(data);
  }

  writeFileSync(filepath, content, { flag: 'w' });

  const contents = readFileSync(filepath, 'utf-8');
  console.log(contents);
  return contents;
}
