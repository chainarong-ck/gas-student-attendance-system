# Server

โฟลเดอร์นี้คือโค้ดฝั่ง Google Apps Script ที่เขียนด้วย TypeScript แล้ว bundle ออกมาเป็น JavaScript ไฟล์เดียว

## หน้าที่ของโฟลเดอร์นี้

- เก็บ logic ฝั่ง server ของ Apps Script
- ไฟล์ต้นฉบับหลักอยู่ใน `src/`
- entry point คือ `src/Code.ts`
- ผลลัพธ์หลัง build ต้องมีเพียงไฟล์เดียวคือ `dist/main.js`
- ไฟล์ `dist/main.js` จะถูก copy ไปเป็น `gas/dist/Code.js`

## คำสั่งที่ใช้บ่อย

ติดตั้งแพ็กเกจ:

```sh
npm install
```

ตรวจ TypeScript:

```sh
npm run typecheck
```

build:

```sh
npm run build
```

build พร้อมตรวจผลลัพธ์:

```sh
npm run build:check
```

ตรวจว่า build แล้วออกมาเป็นไฟล์เดียวจริง:

```sh
npm run check:output
```

## ผลลัพธ์ที่ถูกต้อง

หลังรัน `npm run build:check` โฟลเดอร์ `dist/` ต้องมีไฟล์นี้เท่านั้น:

```text
dist/main.js
```

ห้ามมีไฟล์อื่น เช่น source map, chunk เพิ่มเติม หรือไฟล์ JavaScript อื่น เพราะ Apps Script จะใช้ไฟล์ปลายทางเป็น `Code.js` เพียงไฟล์เดียว

## การเปิด function ให้ Apps Script เรียกใช้

Google Apps Script ต้องเห็น function เช่น `doGet` ใน global scope โปรเจกต์นี้ใช้ `gas-webpack-plugin` เพื่อสร้าง top-level stub จากการ assign function เข้า `global`

ตัวอย่าง:

```ts
function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.HTML.HtmlOutput {
  // ...
}

global.doGet = doGet;
```

ถ้าเพิ่ม function ใหม่ที่ Apps Script ต้องเรียกจากภายนอก ให้ประกาศ function แล้ว assign เข้า `global` เช่น `global.myFunction = myFunction`

## ไฟล์ที่ไม่ควรแก้โดยตรง

ไม่ควรแก้ `dist/main.js` โดยตรง เพราะไฟล์นี้ถูกสร้างจาก TypeScript ทุกครั้งที่ build ถ้าต้องแก้ logic ให้แก้ใน `src/` แล้วรัน build ใหม่
