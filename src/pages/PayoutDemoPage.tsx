import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type PayoutKind = "ร้านค้า" | "คนขับ";
type PayoutStatus = "รอโอน" | "จำลองว่าโอนแล้ว";
type Payout = {
  id: string;
  kind: PayoutKind;
  recipient: string;
  period: string;
  completedOrders: number;
  amount: number;
  status: PayoutStatus;
  reference?: string;
  proofName?: string;
};

const initialPayouts: Payout[] = [
  { id: "PAY-DEMO-001", kind: "ร้านค้า", recipient: "ครัวศรีธาตุ (ข้อมูลจำลอง)", period: "รอบ 26 ต.ค. 02:00 ถึง 27 ต.ค. 02:00", completedOrders: 18, amount: 4230, status: "รอโอน" },
  { id: "PAY-DEMO-002", kind: "ร้านค้า", recipient: "กาแฟบ้านสวน (ข้อมูลจำลอง)", period: "รอบ 26 ต.ค. 02:00 ถึง 27 ต.ค. 02:00", completedOrders: 12, amount: 1875, status: "รอโอน" },
  { id: "PAY-DEMO-003", kind: "คนขับ", recipient: "ไรเดอร์ทดสอบ A", period: "รอบ 26 ต.ค. 02:00 ถึง 27 ต.ค. 02:00", completedOrders: 21, amount: 735, status: "รอโอน" },
  { id: "PAY-DEMO-004", kind: "คนขับ", recipient: "ไรเดอร์ทดสอบ B", period: "รอบ 26 ต.ค. 02:00 ถึง 27 ต.ค. 02:00", completedOrders: 14, amount: 460, status: "รอโอน" },
];

const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(value);

export default function PayoutDemoPage() {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [selectedId, setSelectedId] = useState(initialPayouts[0].id);
  const [reference, setReference] = useState("");
  const [proofName, setProofName] = useState("");
  const [notice, setNotice] = useState("โหมดจำลอง: ไม่มีการโอนเงินจริง อัปโหลดไฟล์ หรือส่งอีเมลจริง");
  const selected = payouts.find((item) => item.id === selectedId) ?? payouts[0];
  const pendingTotal = useMemo(() => payouts.filter((item) => item.status === "รอโอน").reduce((sum, item) => sum + item.amount, 0), [payouts]);
  const completedTotal = useMemo(() => payouts.filter((item) => item.status === "จำลองว่าโอนแล้ว").reduce((sum, item) => sum + item.amount, 0), [payouts]);

  function recordSimulatedPayout() {
    if (!selected || selected.status !== "รอโอน" || (!reference.trim() && !proofName)) return;
    setPayouts((current) => current.map((item) => item.id === selected.id
      ? { ...item, status: "จำลองว่าโอนแล้ว", reference: reference.trim() || undefined, proofName: proofName || undefined }
      : item));
    setNotice(`บันทึกสถานะจำลองสำหรับ ${selected.recipient} แล้ว ระบบจริงต้องตรวจสอบการโอนและส่งอีเมลผ่านบริการที่ตั้งค่าไว้`);
    setReference("");
    setProofName("");
  }

  function resetDemo() {
    setPayouts(initialPayouts);
    setSelectedId(initialPayouts[0].id);
    setReference("");
    setProofName("");
    setNotice("รีเซ็ตข้อมูลจำลองแล้ว ไม่มีการเปลี่ยนแปลงข้อมูลจริง");
  }

  return (
    <main className="dashboard" style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <header className="topbar" style={{ gap: 16, flexWrap: "wrap" }}>
        <a className="wordmark" href="/demo/payouts"><span className="brand-mark small">D</span> Dumri <span style={{ fontSize: 12, fontWeight: 600 }}>โหมดทดสอบ</span></a>
        <Link to="/demo">กลับไปทดสอบออร์เดอร์</Link>
      </header>

      <section className="welcome">
        <p className="eyebrow">DEMO MODE · ข้อมูลและยอดเงินสมมติ</p>
        <h1>ตรวจสอบยอดและจ่ายเงินรายวัน</h1>
        <p className="muted">รอบบัญชีตัดยอด 02:00 น. เวลาไทย · ช่วงดำเนินการโอน 10:00–12:00 น. · สิทธิ์ใช้งานจริงต้องตรวจสอบ Super Admin ฝั่งเซิร์ฟเวอร์</p>
      </section>

      <div role="status" className="notice" style={{ marginBottom: 20 }}>{notice}</div>
      <div className="role-grid" style={{ marginBottom: 20 }}>
        <article className="role-card"><p className="muted">ยอดรอโอน (จำลอง)</p><h2>{money(pendingTotal)}</h2></article>
        <article className="role-card"><p className="muted">ยอดที่บันทึกว่าโอนแล้ว (จำลอง)</p><h2>{money(completedTotal)}</h2></article>
        <article className="role-card"><p className="muted">รายการในรอบทดสอบ</p><h2>{payouts.length} รายการ</h2></article>
      </div>

      <section className="role-card" aria-labelledby="payout-list-heading">
        <h2 id="payout-list-heading">รายการร้านค้าและคนขับ</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {payouts.map((item) => (
            <button key={item.id} type="button" className="role-card" style={{ textAlign: "left", border: selectedId === item.id ? "2px solid #246b50" : undefined }} onClick={() => { setSelectedId(item.id); setReference(""); setProofName(""); }} aria-pressed={selectedId === item.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{item.recipient}</strong><strong>{money(item.amount)}</strong>
              </div>
              <p className="muted" style={{ margin: "6px 0" }}>{item.kind} · {item.id} · {item.completedOrders} ออร์เดอร์จำลอง</p>
              <span className={item.status === "รอโอน" ? "notice" : "success-message"}>{item.status}</span>
              {item.status === "จำลองว่าโอนแล้ว" && <p className="muted" style={{ marginBottom: 0 }}>หลักฐานจำลอง: {item.proofName || item.reference || "ไม่พบข้อมูล"}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="role-card" style={{ marginTop: 20 }} aria-labelledby="payout-detail-heading">
        <h2 id="payout-detail-heading">บันทึกผลการโอน (จำลอง)</h2>
        <p><strong>ผู้รับ:</strong> {selected.recipient}</p>
        <p><strong>ยอดที่ต้องจ่าย:</strong> {money(selected.amount)}</p>
        <p><strong>รอบบัญชี:</strong> {selected.period}</p>
        {selected.status !== "รอโอน" ? (
          <div className="notice">รายการนี้ถูกบันทึกว่าโอนแล้วในโหมดจำลอง ป้องกันการกดซ้ำ</div>
        ) : (
          <div className="form-stack">
            <label>เลขอ้างอิงธุรกรรม
              <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="กรอกเลขอ้างอิงจากธนาคาร" />
            </label>
            <label>หรือเลือกชื่อไฟล์สลิป (ยังไม่อัปโหลดในโหมดจำลอง)
              <input type="file" accept="image/*,.pdf" onChange={(event) => setProofName(event.target.files?.[0]?.name ?? "")} />
            </label>
            <p className="muted">ต้องกรอกเลขอ้างอิงหรือเลือกไฟล์อย่างน้อยหนึ่งอย่างก่อนเปิดปุ่มบันทึก</p>
            <button type="button" onClick={recordSimulatedPayout} disabled={!reference.trim() && !proofName}>จำลองกด “โอนแล้ว” และการแจ้งอีเมล</button>
          </div>
        )}
      </section>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
        <button type="button" className="button-secondary" onClick={resetDemo}>รีเซ็ตข้อมูลทดสอบ</button>
        <Link to="/login">ไปหน้าเข้าสู่ระบบจริง</Link>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 24 }}>ข้อจำกัด: ข้อมูลเก็บในหน่วยความจำของหน้าเว็บเท่านั้น การเลือกไฟล์ไม่อัปโหลดจริง และไม่มีการเชื่อมธนาคาร ฐานข้อมูล หรือบริการส่งอีเมล รายการเหล่านี้ใช้ทดสอบหน้าจอและกติกาเท่านั้น</p>
    </main>
  );
}
