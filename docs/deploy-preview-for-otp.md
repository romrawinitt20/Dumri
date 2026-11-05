# เตรียม Dumri สำหรับทดสอบ SMS OTP ผ่านเว็บ

คู่มือนี้ใช้สร้าง **preview/test deployment** จาก GitHub โดยยังไม่ถือว่าแอปพร้อม production และไม่เปลี่ยนแปลงฐานข้อมูล Supabase

## 1. สร้างเว็บทดสอบบน Vercel

1. เปิด https://vercel.com/new และลงชื่อเข้าใช้ด้วยบัญชีของคุณ
2. เลือก Import Git Repository แล้วเลือก `romrawinitt20/Dumri`
3. ถ้า Vercel ขอสิทธิ์ GitHub ให้เลือกเฉพาะ repository Dumri เท่าที่ทำได้
4. ตั้งค่าโปรเจกต์:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. ใน Environment Variables เพิ่มค่าต่อไปนี้สำหรับ Preview:
   - `VITE_SUPABASE_URL` = URL ของ Supabase project ที่ต้องการทดสอบ
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = publishable key ของ project เดียวกัน
6. Deploy แล้วคัดลอก URL ที่ Vercel ให้มา

**ห้าม** ใส่ `service_role`, secret key, database password หรือ OTP ลงในตัวแปร `VITE_*` หรือ GitHub repository เพราะตัวแปร frontend จะถูกส่งไปยัง browser

## 2. ตั้งค่า Supabase Auth URL

ใน Supabase Dashboard ของ project ที่เลือก ไปที่ Authentication → URL Configuration:

1. เริ่มจากเพิ่ม URL ของเว็บทดสอบใน Redirect URLs เช่น `https://YOUR-APP.vercel.app/**`
2. **อย่าเปลี่ยน Site URL ปัจจุบันทันที** เพราะ Supabase project นี้เคยถูกใช้ร่วมกับแอปอื่น ให้ตรวจสอบ redirect ที่ใช้อยู่และผลกระทบก่อน
3. หากต้องเปลี่ยน Site URL ให้เปลี่ยนหลังจากยืนยันแล้วว่าไม่ทำให้แอปอื่นที่แชร์ project เดียวกันเสียการทำงาน
4. หากใช้ Vercel Preview Deployment ที่มี URL เปลี่ยนตาม commit ให้เพิ่มเฉพาะ preview pattern ที่จำเป็นและปลอดภัย หลีกเลี่ยง wildcard ที่กว้างเกินไป

การตั้งค่า Auth URL เป็นระดับ project จึงอาจกระทบแอปอื่นที่ใช้ Supabase project เดียวกันได้

## 3. เปิดใช้งาน SMS OTP

ใน Supabase Dashboard → Authentication → Providers → Phone:

- เปิด Phone provider
- ตั้งค่า SMS provider และ credentials ที่ผู้ให้บริการกำหนด
- ตรวจ rate limits และค่าใช้จ่ายของผู้ให้บริการ SMS ก่อนส่ง OTP จริง

การเปิด Phone provider อย่างเดียวอาจไม่เพียงพอ หากยังไม่ได้ตั้งค่า SMS provider

## 4. ทดสอบอย่างปลอดภัย

ใช้เบอร์โทรศัพท์ที่คุณควบคุมได้และเป็นบัญชีทดสอบใหม่:

1. เปิด `/register` และสมัครเป็น Customer ก่อน
2. ตรวจว่าได้รับ SMS แล้วกรอกรหัส OTP ในเว็บ
3. ตรวจ Supabase Auth → Users ว่ามีค่า Phone Confirmed At
4. ตรวจว่าโปรไฟล์เชื่อมกับ Auth UID เดียวกัน และผู้สมัครใหม่ไม่ได้รับ role admin
5. ทดสอบรหัสผิด/หมดอายุ และการส่งรหัสใหม่

ห้ามส่ง OTP, access token, service-role key หรือ secret ผ่านแชต/issue/commit

## 5. ข้อจำกัด

- เว็บทดสอบไม่ได้หมายความว่าการส่ง SMS จะพร้อมจนกว่าจะตั้งค่า provider
- หน้าเว็บที่เปิดได้และ build ผ่านยังไม่ใช่การรับรองความปลอดภัยของ RLS/RPC หรือระบบชำระเงิน
- ใช้เป็น preview/test เท่านั้น จนกว่าจะผ่านการทดสอบ Auth, profile linking และ policies
