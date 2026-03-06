import sharp from 'sharp';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join('C:\\Users\\SHOMER WORLD\\.gemini\\antigravity\\brain\\02dc54e4-7a90-4c94-9a29-56ef202741f1', 'ironlog_icon_512_1772824572505.png');
const out512 = join(__dirname, '..', 'public', 'icon-512.png');
const out192 = join(__dirname, '..', 'public', 'icon-192.png');

async function go() {
    await sharp(srcPath).resize(512, 512).toFile(out512);
    console.log('✅ 512x512 done');
    await sharp(srcPath).resize(192, 192).toFile(out192);
    console.log('✅ 192x192 done');
}
go().catch(console.error);
