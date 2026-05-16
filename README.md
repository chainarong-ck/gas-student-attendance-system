# Student Attendance System

โปรเจกต์นี้เป็นระบบ Student Attendance System สำหรับ Google Apps Script แบ่งออกเป็น 3 ส่วนหลัก:

```text
frontend/  หน้าเว็บ Vite + React + TypeScript
server/    โค้ดฝั่ง Google Apps Script เขียนด้วย TypeScript
gas/       โฟลเดอร์รวมไฟล์ที่พร้อมอัปโหลดขึ้น Google Apps Script
```

แนวคิดสำคัญของโปรเจกต์นี้คือ `frontend` และ `server` ต้อง build ออกมาเป็นไฟล์เดียวเท่านั้น แล้วจึง copy เข้า `gas/dist/` เพื่ออัปโหลดด้วย clasp

## ภาพรวมไฟล์หลัง build

ผลลัพธ์ที่ถูกต้องต้องเป็นแบบนี้:

```text
frontend/dist/index.html
server/dist/main.js
gas/dist/Code.js
gas/dist/Index.html
gas/dist/appsscript.json
```

ไฟล์ที่ถูกอัปโหลดขึ้น Google Apps Script จริงคือไฟล์ใน `gas/dist/` เท่านั้น

## ทำไมต้องเป็นไฟล์เดียว

Google Apps Script ไม่ได้ทำงานเหมือนเว็บโฮสติ้งทั่วไป โปรเจกต์นี้ตั้งใจให้:

- frontend รวม HTML, CSS, JavaScript และรูปที่ import ผ่าน source ให้จบใน `index.html`
- server รวม TypeScript ทุกส่วนให้จบใน `main.js`
- gas รับเฉพาะไฟล์ปลายทางที่จำเป็น 3 ไฟล์

ถ้า build แล้วมีไฟล์อื่น เช่น `assets/image.png`, `index-xxxxx.js`, `style-xxxxx.css` หรือ chunk เพิ่มเติม ไฟล์เหล่านั้นจะไม่ถูกนำไปใช้ตาม flow นี้ และอาจทำให้หน้าเว็บเสียหรือ Apps Script ทำงานไม่ครบ

## เตรียมเครื่องครั้งแรก

ต้องมี Node.js เวอร์ชัน 18 ขึ้นไป และ npm

ติดตั้งแพ็กเกจทุกโฟลเดอร์จาก root:

```sh
npm run install:all
```

ถ้ายังไม่ได้ login clasp:

```sh
npm run login
```

จากนั้นตั้งค่า `gas/.clasp.json` โดยดูตัวอย่างจาก `gas/.clasp.json.example` และใส่ `scriptId` ของ Google Apps Script project จริง

## Build ทั้งโปรเจกต์

จาก root:

```sh
npm run build
```

คำสั่งนี้จะทำตามลำดับ:

1. build frontend
2. ตรวจว่า `frontend/dist/` มีแค่ `index.html`
3. typecheck และ build server
4. ตรวจว่า `server/dist/` มีแค่ `main.js`
5. copy ไฟล์เข้า `gas/dist/`
6. ตรวจว่า `gas/dist/` มีแค่ `Code.js`, `Index.html`, `appsscript.json`

## อัปโหลดขึ้น Google Apps Script

จาก root:

```sh
npm run push
```

คำสั่งนี้จะ build และตรวจไฟล์ก่อน แล้วจึงอัปโหลดด้วย `clasp push`

หลังจาก push แล้ว deploy ด้วย:

```sh
npm run deploy
```

## คำสั่งตรวจไฟล์อย่างเดียว

ถ้าต้องการตรวจผลลัพธ์ที่ build ไว้แล้ว:

```sh
npm run check:outputs
```

## โครงสร้างเอกสาร

อ่านรายละเอียดแต่ละส่วนได้ที่:

- `frontend/README.md`
- `server/README.md`
- `gas/README.md`

## ข้อควรระวังสำหรับผู้รับโปรเจกต์

- อย่าแก้ไฟล์ใน `dist/` โดยตรง เพราะจะถูกสร้างใหม่จากการ build
- ถ้าต้องแก้หน้าจอ ให้แก้ใน `frontend/src/`
- ถ้าต้องแก้ logic ฝั่ง Apps Script ให้แก้ใน `server/src/`
- ถ้าต้องแก้ manifest ให้แก้ `gas/appsscript.json`
- ก่อน push ทุกครั้งควรรัน `npm run build` หรือใช้ `npm run push` จาก root
- ถ้ามีไฟล์อื่นโผล่ใน `dist/` ให้หยุดก่อน เพราะแปลว่า build ไม่ตรงกับรูปแบบที่ระบบนี้ออกแบบไว้

## Flow การทำงานที่แนะนำ

```text
แก้ frontend/src หรือ server/src
        ↓
npm run build
        ↓
ตรวจว่า dist มีไฟล์ถูกต้อง
        ↓
npm run push
        ↓
npm run deploy
```
