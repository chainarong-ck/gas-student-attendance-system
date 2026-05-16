# Frontend

โฟลเดอร์นี้คือหน้าเว็บของระบบ Student Attendance System เขียนด้วย Vite + React + TypeScript แล้ว build ออกมาเป็นไฟล์ HTML ไฟล์เดียวสำหรับนำไปใส่ใน Google Apps Script

## หน้าที่ของโฟลเดอร์นี้

- ใช้พัฒนาหน้าจอผู้ใช้งาน
- ไฟล์ต้นฉบับหลักอยู่ใน `src/`
- ผลลัพธ์หลัง build ต้องมีเพียงไฟล์เดียวคือ `dist/index.html`
- ไฟล์ `dist/index.html` จะถูก copy ไปเป็น `gas/dist/Index.html`

## คำสั่งที่ใช้บ่อย

ติดตั้งแพ็กเกจ:

```sh
npm install
```

เปิดโหมดพัฒนา:

```sh
npm run dev
```

build สำหรับใช้งานจริง:

```sh
npm run build
```

ตรวจว่า build แล้วออกมาเป็นไฟล์เดียวจริง:

```sh
npm run check:output
```

## ผลลัพธ์ที่ถูกต้อง

หลังรัน `npm run build` โฟลเดอร์ `dist/` ต้องมีไฟล์นี้เท่านั้น:

```text
dist/index.html
```

ห้ามมีไฟล์อื่น เช่น:

```text
dist/assets/logo.png
dist/assets/index-xxxxx.js
dist/assets/index-xxxxx.css
```

เหตุผลคือ Google Apps Script ส่วนนี้จะอัปโหลดเฉพาะ `Index.html` ถ้ามีรูป ไฟล์ CSS หรือไฟล์ JS แยกออกมา ไฟล์เหล่านั้นจะไม่ถูกอัปโหลดไปพร้อมกัน และหน้าเว็บอาจแสดงผลผิดพลาด

## การใช้รูปภาพและ asset

ถ้าต้องใช้รูปภาพ ให้ import จากโค้ด React เช่น:

```ts
import heroImg from './assets/hero.png'
```

เมื่อ build แล้ว Vite จะฝังรูปเข้าไปใน `index.html` ให้เองผ่าน `vite-plugin-singlefile`

ควรหลีกเลี่ยงการอ้างไฟล์แบบนี้:

```html
<img src="/logo.png" />
<use href="/icons.svg#icon-name"></use>
```

เพราะเป็นการชี้ไปหาไฟล์แยกด้านนอก ถ้าไฟล์นั้นไม่ได้ถูกอัปโหลดขึ้น Apps Script หน้าเว็บจะหาไฟล์ไม่เจอ

## ระบบป้องกันไฟล์หลุด

โปรเจกต์นี้มีคำสั่ง `npm run check:output` สำหรับตรวจว่า:

- ใน `dist/` มีแค่ `index.html`
- ใน HTML ไม่มีการอ้างไฟล์ local แบบ `/some-file.png` หรือ `/icons.svg`

ถ้าตรวจไม่ผ่าน ให้แก้ source ใน `src/` แล้ว build ใหม่

## ไฟล์ที่ไม่ควรแก้โดยตรง

ไม่ควรแก้ `dist/index.html` โดยตรง เพราะไฟล์นี้ถูกสร้างใหม่ทุกครั้งที่ build ถ้าต้องแก้หน้าจอ ให้แก้ใน `src/` แล้วรัน build ใหม่
