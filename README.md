# Dumri

แพลตฟอร์มส่งอาหารที่เป็นธรรมสำหรับลูกค้า ร้านค้า และไรเดอร์ โดยเริ่มจากพื้นที่อำเภอศรีธาตุและท่าคันโท

## สิ่งที่มีใน starter นี้

- สมัครสมาชิกด้วยอีเมลและรหัสผ่านผ่าน Supabase Auth
- เข้าสู่ระบบ / ออกจากระบบ
- โหลดและคง session เมื่อเปิดแอปใหม่
- ป้องกันเส้นทาง `/dashboard` ด้วย ProtectedRoute
- หน้าล็อกอิน สมัครสมาชิก และแดชบอร์ดทดสอบภาษาไทย
- ตัวอย่างไฟล์ environment โดยไม่ฝัง credentials ในซอร์สโค้ด

ประเภทลูกค้า ร้านค้า และไรเดอร์ในแดชบอร์ดเป็นเพียงตัวอย่าง UI ยังไม่ได้เชื่อม role จริงกับฐานข้อมูล และยังไม่มีสิทธิ์แอดมินในขั้นนี้

## เริ่มต้นใช้งาน

ต้องมี Node.js รุ่นที่รองรับ Vite 7

1. ติดตั้ง dependencies: `npm install`
2. คัดลอก `.env.example` เป็น `.env`
3. กำหนดค่าจริงใน `.env`:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

4. รันแอป: `npm run dev`
5. ตรวจ production build: `npm run build`

## ตั้งค่า Supabase Auth

- ใน Supabase Dashboard เปิด Authentication และตรวจว่า Email provider เปิดใช้งาน
- ตั้ง Site URL และ Redirect URLs ใน Authentication > URL Configuration ให้ตรงกับ URL ที่ใช้ทดสอบ
- ถ้าเปิด email confirmation ผู้สมัครต้องยืนยันอีเมลก่อนเข้าสู่ระบบ
- ใช้ publishable key ได้ใน browser; ห้ามใช้ `service_role` หรือ secret key ใน frontend หรือในตัวแปร `VITE_*`

## ข้อควรระวังด้านความปลอดภัย

ProtectedRoute ป้องกันเฉพาะ UI navigation ไม่ใช่ขอบเขตความปลอดภัยของข้อมูล การอ่าน/เขียนข้อมูลต้องถูกจำกัดด้วย RLS และ policies ที่ตรวจ ownership/role ในฐานข้อมูล ห้ามใช้ user-editable metadata เป็นหลักฐานสิทธิ์

## ขั้นต่อไป

ตรวจ schema และ RLS ที่มีอยู่ใน Supabase ก่อน จากนั้นเชื่อม Auth user กับโปรไฟล์ที่มีอยู่สำหรับลูกค้า ร้านค้า ไรเดอร์ และแอดมิน โดยไม่สร้างตารางซ้ำหรือเปลี่ยน schema แบบเหมารวม
