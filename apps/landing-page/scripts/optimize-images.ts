import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicImagesDir = join(rootDir, "public/images");
const cacheDir = join(publicImagesDir, "gen");

async function optimizeImages() {
  const inputPath = join(publicImagesDir, "suwa-hero-watercolor.png");

  const inputBuffer = await readFile(inputPath);
  const metadata = await sharp(inputBuffer).metadata();
  console.log(
    "🖼️  Original:",
    metadata.width,
    "x",
    metadata.height,
    metadata.format,
    `${(inputBuffer.length / 1024).toFixed(0)}KB`
  );

  // Wipe and recreate cache dir
  if (existsSync(cacheDir)) {
    await rm(cacheDir, { recursive: true, force: true });
  }
  await mkdir(cacheDir, { recursive: true });

  const sizes = [
    { width: 450, suffix: "450w" },
    { width: 690, suffix: "690w" },
    { width: 900, suffix: "900w" },
    { width: 1536, suffix: "1536w" },
  ];

  for (const { width, suffix } of sizes) {
    const base = join(cacheDir, `suwa-hero-${suffix}`);

    await sharp(inputBuffer)
      .resize(width)
      .png({ compressionLevel: 9, palette: true })
      .toFile(`${base}.png`);
    const pngSize = (await readFile(`${base}.png`)).length / 1024;

    await sharp(inputBuffer)
      .resize(width)
      .webp({ quality: 80, effort: 6 })
      .toFile(`${base}.webp`);
    const webpSize = (await readFile(`${base}.webp`)).length / 1024;

    await sharp(inputBuffer)
      .resize(width)
      .avif({ quality: 65, effort: 6 })
      .toFile(`${base}.avif`);
    const avifSize = (await readFile(`${base}.avif`)).length / 1024;

    console.log(
      `  ${width}px: PNG=${pngSize.toFixed(0)}KB WebP=${webpSize.toFixed(0)}KB AVIF=${avifSize.toFixed(0)}KB`
    );
  }

  // Blur placeholder
  const blurBuf = await sharp(inputBuffer)
    .resize(20)
    .blur(3)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const blurB64 = blurBuf.toString("base64");
  await writeFile(
    join(cacheDir, "blur.txt"),
    `data:image/png;base64,${blurB64}`
  );
  console.log(`  blur: ${(blurBuf.length / 1024).toFixed(0)}KB`);

  // Optimize source in place
  const tmpPath = `${inputPath}.tmp`;
  await sharp(inputBuffer)
    .png({ compressionLevel: 9, palette: true })
    .toFile(tmpPath);
  await readFile(tmpPath).then((b) => writeFile(inputPath, b));
  const finalSize = (await readFile(inputPath)).length / 1024;
  console.log(`  source optimized: ${finalSize.toFixed(0)}KB`);

  console.log("✅ Image optimization complete");
}

optimizeImages().catch(console.error);
