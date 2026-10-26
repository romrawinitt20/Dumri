import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type DemoRole = "customer" | "merchant" | "rider";
type OrderStatus = "cart" | "placed" | "accepted" | "preparing" | "ready" | "picked_up" | "delivered";
type DemoOrder = {
  id: string;
  shop: string;
  item: string;
  quantity: number;
  unitPrice: number;
  deliveryFee: number;
  payment: "จำลองเงินสด" | "จำลองโอนเงิน";
  status: OrderStatus;
};

const shops = [
  { name: "ครัวศรีธาตุ", item: "ข้าวกะเพราไก่", price: 55, detail: "อาหารตามสั่ง" },
  { name: "กาแฟบ้านสวน", item: "กาแฟเย็น", price: 45, detail: "กาแฟและเครื่องดื่ม" },
  { name: "อิ่มอร่อย", item: "ข้าวผัดหมู", price: 50, detail: "อาหารจานเดียว" },
];

const statusLabels: Record<OrderStatus, string> = {
  cart: "ตะกร้า",
  placed: "ส่งคำสั่งซื้อแล้ว",
  accepted: "ร้านรับออร์เดอร์แล้ว",
  preparing: "ร้านกำลังทำอาหาร",
  ready: "อาหารพร้อมรับ",
  picked_up: "ไรเดอร์รับอาหารแล้ว",
  delivered: "ส่งอาหารแล้ว",
};

const statusSteps: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "picked_up", "delivered"];
const money = (value: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function DemoPage() {
  const [role, setRole] = useState<DemoRole>("customer");
  const [selectedShop, setSelectedShop] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<DemoOrder["payment"]>("จำลองเงินสด");
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [notice, setNotice] = useState("ข้อมูลทั้งหมดเป็นข้อมูลจำลองในหน้านี้ ไม่เชื่อมฐานข้อมูลและไม่รับชำระเงินจริง");
  const shop = shops[selectedShop];
  const total = useMemo(() => shop.price * quantity + 20, [shop.price, quantity]);
  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  function placeOrder() {
    setOrder({
      id: "DEMO-2026-001",
      shop: shop.name,
      item: shop.item,
      quantity,
      unitPrice: shop.price,
      deliveryFee: 20,
      payment,
      status: "placed",
    });
    setNotice("สร้างออร์เดอร์จำลองแล้ว ไม่มีการตัดเงินหรือส่งออร์เดอร์ไปยังร้านจริง");
    setRole("merchant");
  }

  function advanceOrder(next: OrderStatus, message: string) {
    setOrder((previous) => previous ? { ...previous, status: next } : previous);
    setNotice(message);
  }

  return (
    <main className="dashboard" style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <header className="topbar" style={{ gap: 16, flexWrap: "wrap" }}>
        <a className="wordmark" href="/demo"><span className="brand-mark small">D</span> Dumri <span style={{ fontSize: 12, fontWeight: 600 }}>โหมดทดสอบ</span></a>
        <Link to="/login">ไปหน้าเข้าสู่ระบบจริง</Link>
      </header>

      <section className="welcome">
        <p className="eyebrow">DEMO MODE · ไม่ใช้ข้อมูลจริง</p>
        <h1>ทดสอบเส้นทางสั่งอาหาร</h1>
        <p className="muted">จำลองเส้นทางลูกค้า → ร้านค้า → ไรเดอร์ โดยใช้ออร์เดอร์เดียวกันและเปลี่ยนสถานะร่วมกัน</p>
      </section>

      <div role="status" className="notice" style={{ marginBottom: 20 }}>{notice}</div>

      <nav aria-label="เลือกบทบาททดสอบ" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {([
          ["customer", "1. ลูกค้า"],
          ["merchant", "2. ร้านค้า"],
          ["rider", "3. ไรเดอร์"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" className={role === value ? "" : "button-secondary"} onClick={() => setRole(value)} aria-pressed={role === value}>{label}</button>
        ))}
      </nav>

      {role === "customer" && (
        <section className="role-card" aria-labelledby="customer-heading">
          <h2 id="customer-heading">เลือกร้านและสั่งอาหาร</h2>
          <div className="role-grid">
            {shops.map((entry, index) => (
              <button key={entry.name} type="button" className="role-card" style={{ textAlign: "left", border: selectedShop === index ? "2px solid #246b50" : undefined }} onClick={() => setSelectedShop(index)} aria-pressed={selectedShop === index}>
                <h3>{entry.name}</h3><p className="muted">{entry.detail}</p><p>{entry.item}</p><strong>{money(entry.price)}</strong>
              </button>
            ))}
          </div>
          <div className="form-stack" style={{ marginTop: 20 }}>
            <label>จำนวน
              <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} รายการ</option>)}
              </select>
            </label>
            <label>วิธีชำระเงิน (จำลองเท่านั้น)
              <select value={payment} onChange={(event) => setPayment(event.target.value as DemoOrder["payment"])}>
                <option value="จำลองเงินสด">เงินสดปลายทาง — จำลอง</option>
                <option value="จำลองโอนเงิน">โอนเงิน — จำลอง</option>
              </select>
            </label>
            <div className="notice">
              <p>ค่าอาหาร: {money(shop.price * quantity)}</p>
              <p>ค่าส่งตัวอย่าง: {money(20)}</p>
              <strong>ยอดรวมตัวอย่าง: {money(total)}</strong>
            </div>
            <button type="button" onClick={placeOrder} disabled={Boolean(order && order.status !== "delivered")}>สร้างออร์เดอร์จำลอง</button>
          </div>
        </section>
      )}

      {role === "merchant" && (
        <section className="role-card" aria-labelledby="merchant-heading">
          <h2 id="merchant-heading">หน้าร้านค้า — จัดการออร์เดอร์</h2>
          {!order ? <p className="muted">ยังไม่มีออร์เดอร์ ให้กลับไปหน้าลูกค้าแล้วสร้างออร์เดอร์จำลองก่อน</p> : (
            <>
              <p><strong>เลขออร์เดอร์:</strong> {order.id}</p>
              <p><strong>ร้าน:</strong> {order.shop}</p>
              <p><strong>รายการ:</strong> {order.item} × {order.quantity}</p>
              <p><strong>การชำระ:</strong> {order.payment} (ไม่มีการรับเงินจริง)</p>
              <p><strong>สถานะ:</strong> {statusLabels[order.status]}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <button type="button" onClick={() => advanceOrder("accepted", "ร้านรับออร์เดอร์จำลองแล้ว")} disabled={order.status !== "placed"}>รับออร์เดอร์</button>
                <button type="button" onClick={() => advanceOrder("preparing", "ร้านเริ่มทำอาหารจำลองแล้ว")} disabled={order.status !== "accepted"}>เริ่มทำอาหาร</button>
                <button type="button" onClick={() => advanceOrder("ready", "อาหารจำลองพร้อมให้ไรเดอร์รับ")} disabled={order.status !== "preparing"}>อาหารพร้อม</button>
              </div>
            </>
          )}
        </section>
      )}

      {role === "rider" && (
        <section className="role-card" aria-labelledby="rider-heading">
          <h2 id="rider-heading">หน้าไรเดอร์ — รับและส่งอาหาร</h2>
          {!order ? <p className="muted">ยังไม่มีออร์เดอร์ ให้ลูกค้าสร้างออร์เดอร์ก่อน</p> : (
            <>
              <p><strong>เลขออร์เดอร์:</strong> {order.id}</p>
              <p><strong>รับจากร้าน:</strong> {order.shop}</p>
              <p><strong>ส่งให้ลูกค้า:</strong> ที่อยู่ทดสอบ Dumri</p>
              <p><strong>สถานะ:</strong> {statusLabels[order.status]}</p>
              <p><strong>ค่าส่งจำลอง:</strong> {money(order.deliveryFee)} — ไม่ใช่ยอดจ่ายจริงให้ไรเดอร์</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <button type="button" onClick={() => advanceOrder("picked_up", "ไรเดอร์รับอาหารจำลองแล้ว")} disabled={order.status !== "ready"}>ยืนยันรับอาหาร</button>
                <button type="button" onClick={() => advanceOrder("delivered", "ส่งออร์เดอร์จำลองครบเส้นทางแล้ว")} disabled={order.status !== "picked_up"}>ยืนยันส่งสำเร็จ</button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="role-card" style={{ marginTop: 20 }} aria-labelledby="journey-heading">
        <h2 id="journey-heading">ติดตามเส้นทางออร์เดอร์</h2>
        {!order ? <p className="muted">เส้นทางจะเริ่มหลังสร้างออร์เดอร์</p> : (
          <>
            <p><strong>{order.id}</strong> · {order.shop} · {statusLabels[order.status]}</p>
            <ol style={{ paddingLeft: 22 }}>
              {statusSteps.map((step, index) => (
                <li key={step} style={{ margin: "8px 0", fontWeight: index <= currentStep ? 700 : 400 }}>
                  {index <= currentStep ? "✓ " : "○ "}{statusLabels[step]}
                </li>
              ))}
            </ol>
            <p className="muted">ยอดรวมจำลอง: {money(order.unitPrice * order.quantity + order.deliveryFee)} · วิธีชำระ: {order.payment}</p>
            {order.status === "delivered" && <p className="notice">ทดสอบครบเส้นทางแล้ว คุณสามารถสร้างออร์เดอร์ใหม่เพื่อทดสอบซ้ำได้</p>}
            <button type="button" className="button-secondary" onClick={() => { setOrder(null); setQuantity(1); setNotice("รีเซ็ตข้อมูลจำลองแล้ว ไม่มีข้อมูลถูกบันทึกลงฐานข้อมูล"); setRole("customer"); }}>เริ่มทดสอบใหม่</button>
          </>
        )}
      </section>
      <p className="muted" style={{ fontSize: 12, marginTop: 24 }}>ข้อจำกัด: ข้อมูลจะหายเมื่อรีเฟรชหน้า ไม่มีการเชื่อมฐานข้อมูล, SMS, แผนที่, การชำระเงินจริง หรือการมอบหมายไรเดอร์จริง</p>
    </main>
  );
}
