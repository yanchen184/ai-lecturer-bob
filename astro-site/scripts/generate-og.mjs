#!/usr/bin/env node
/**
 * 生成 og-default.png（1200x630, Neub 風格）。
 *   node scripts/generate-og.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'public', 'og-default.png');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FAFAFA"/>
  <rect x="60" y="60" width="1080" height="510" fill="#FFFFFF" stroke="#000" stroke-width="6"/>
  <rect x="84" y="84" width="1032" height="462" fill="transparent" stroke="#000" stroke-width="2" stroke-dasharray="6 4" opacity="0.25"/>

  <!-- Logo badge -->
  <rect x="120" y="130" width="80" height="80" fill="#FFEB3B" stroke="#000" stroke-width="4"/>
  <text x="160" y="188" text-anchor="middle" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-weight="900" font-size="48" fill="#000">陳</text>

  <!-- Headline -->
  <text x="120" y="310" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-weight="900" font-size="84" fill="#000" letter-spacing="-2">AI 講師陳彥彤YC</text>

  <!-- Highlight pill -->
  <rect x="120" y="360" width="560" height="52" fill="#FFEB3B"/>
  <text x="140" y="398" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="26" fill="#000">後端工程師 · Spring Boot / React</text>

  <!-- Subline -->
  <text x="120" y="470" font-family="'PingFang TC', 'Noto Sans TC', sans-serif" font-weight="500" font-size="28" fill="#333">企業內訓 · 技術寫作 · 系統架構諮詢</text>

  <!-- Tags row -->
  <g font-family="'JetBrains Mono', monospace" font-weight="700" font-size="20" fill="#000">
    <rect x="120" y="498" width="140" height="36" fill="transparent" stroke="#000" stroke-width="2"/>
    <text x="190" y="522" text-anchor="middle">JAVA 21</text>
    <rect x="275" y="498" width="170" height="36" fill="transparent" stroke="#000" stroke-width="2"/>
    <text x="360" y="522" text-anchor="middle">SPRING BOOT</text>
    <rect x="460" y="498" width="140" height="36" fill="transparent" stroke="#000" stroke-width="2"/>
    <text x="530" y="522" text-anchor="middle">REACT 19</text>
    <rect x="615" y="498" width="120" height="36" fill="transparent" stroke="#000" stroke-width="2"/>
    <text x="675" y="522" text-anchor="middle">MYSQL</text>
    <rect x="750" y="498" width="120" height="36" fill="transparent" stroke="#000" stroke-width="2"/>
    <text x="810" y="522" text-anchor="middle">REDIS</text>
  </g>

  <!-- Bottom-right corner: site URL -->
  <text x="1080" y="560" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="500" font-size="16" fill="#666">yanchen184.github.io/ai-lecturer-bob</text>
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const png = resvg.render().asPng();
writeFileSync(out, png);
console.log(`[og] generated ${out} (${png.length} bytes)`);
