# Gas

โฟลเดอร์นี้คือส่วนที่เตรียมไฟล์สำหรับอัปโหลดขึ้น Google Apps Script ด้วย clasp

## หน้าที่ของโฟลเดอร์นี้

- รวมไฟล์ที่ build แล้วจาก `frontend` และ `server`
- เก็บ `appsscript.json` ซึ่งเป็น manifest ของ Apps Script
- โฟลเดอร์ `dist/` คือโฟลเดอร์ที่ clasp ใช้อัปโหลดขึ้น Google Apps Script

## ไฟล์ที่จะถูกอัปโหลด

เมื่อเตรียมไฟล์ถูกต้องแล้ว `gas/dist/` ต้องมีเพียง 3 ไฟล์นี้:

```text
gas/dist/Code.js
gas/dist/Index.html
gas/dist/appsscript.json
```

ความหมายของแต่ละไฟล์:

- `Code.js` มาจาก `server/dist/main.js`
- `Index.html` มาจาก `frontend/dist/index.html`
- `appsscript.json` มาจาก `gas/appsscript.json`

ถ้ามีไฟล์อื่นอยู่ใน `gas/dist/` ให้ถือว่าผิดรูปแบบของโปรเจกต์นี้ เพราะอาจทำให้การอัปโหลดหรือการดูแลระบบสับสน

## ตั้งค่า clasp ครั้งแรก

ติดตั้งแพ็กเกจ:

```sh
npm install
```

เข้าสู่ระบบ Google:

```sh
npm run login
```

สร้างไฟล์ `.clasp.json` จากตัวอย่าง:

```text
gas/.clasp.json.example
```

แล้วใส่ `scriptId` ของ Google Apps Script project จริง

ตัวอย่าง:

```json
{
  "scriptId": "ใส่_SCRIPT_ID_จริง",
  "rootDir": "dist"
}
```

ค่า `rootDir` ต้องเป็น `dist` เพื่อให้ clasp อัปโหลดเฉพาะไฟล์ที่เตรียมไว้แล้ว

## เตรียมไฟล์สำหรับอัปโหลด

จากโฟลเดอร์ `gas`:

```sh
npm run prepare
```

คำสั่งนี้จะ copy ไฟล์จาก frontend/server เข้ามาใน `gas/dist/`

ตรวจผลลัพธ์:

```sh
npm run check:output
```

## อัปโหลดขึ้น Google Apps Script

แนะนำให้สั่งจาก root ของโปรเจกต์:

```sh
npm run push
```

คำสั่งนี้จะ build frontend, build server, เตรียม `gas/dist/`, ตรวจจำนวนไฟล์ แล้วจึง `clasp push`

ถ้าสั่งจากโฟลเดอร์ `gas` โดยตรง:

```sh
npm run push
```

ต้องแน่ใจก่อนว่า frontend และ server ถูก build ล่าสุดแล้ว

## Deploy

หลัง push แล้ว สามารถ deploy ได้ด้วย:

```sh
npm run deploy
```

การ deploy จะใช้ระบบของ Google Apps Script และ clasp ตามสิทธิ์ของบัญชี Google ที่ login อยู่
