import React, { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
  position: string;
  status: string;
};

type Settings = {
  bases: string[];
  products: Record<string, number>;
  pointUnit: number;
  monthlyFixed: number;
  workingDays: number;
  dailyWage: number;
};

type RecordItem = {
  date: string;
  base: string;
  name: string;
  position: string;
  payType: string;
  product: string;
  count: number;
  points: number;
  attendance: boolean;
  memo: string;
  revenue: number;
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbwjikjR7Fk-mrKGcQ6si9BV0Ix5NOPaTZYUPIOgY4QxKYyTVebS8_UX3qGWh4vnPdsiSQ/exec";

const defaultSettings: Settings = {
  bases: ["すまえる", "地域創生"],
  products: {
    電気: 300,
    ガス: 300,
    回線: 6000,
    ウォーター: 6000,
    法人電気: 13000,
  },
  pointUnit: 13000,
  monthlyFixed: 158000,
  workingDays: 22,
  dailyWage: 158000 / 22,
};

const today = new Date().toISOString().slice(0, 10);

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    date: today,
    base: "すまえる",
    memberId: "",
    name: "",
    position: "ビギナー",
    payType: "完全歩合",
    product: "電気",
    count: "",
    points: "",
    attendance: false,
    memo: "",
  });

  useEffect(() => {
    fetch(GAS_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.members || []);
          setSettings(data.settings || defaultSettings);
        }
      });
  }, []);

  const productOptions = useMemo(() => {
    if (form.base === "地域創生") return ["法人電気"];
    return ["電気", "ガス", "回線", "ウォーター"];
  }, [form.base]);

  const previewRevenue = useMemo(() => {
    const count = Number(form.count || 0);
    const points = Number(form.points || 0);

    let incentive = 0;

    if (form.base === "すまえる") {
      incentive = count * (settings.products[form.product] || 0);
    }

    if (form.base === "地域創生") {
      incentive = points * settings.pointUnit;
    }

    let fixedPay = 0;

    if (
      form.attendance &&
      (form.payType === "固定" || form.payType === "固定＋インセン")
    ) {
      fixedPay = settings.dailyWage;
    }

    if (form.payType === "完全歩合") {
      fixedPay = 0;
    }

    return Math.round(incentive + fixedPay);
  }, [form, settings]);

  const handleMemberChange = (id: string) => {
    const member = members.find((m) => m.id === id);
    setForm((prev) => ({
      ...prev,
      memberId: id,
      name: member?.name || "",
      position: member?.position || prev.position,
    }));
  };

  const handleSave = async () => {
    if (!form.name) {
      setMessage("メンバー選択して！");
      return;
    }

    setSaving(true);

    const payload = {
      date: form.date,
      base: form.base,
      name: form.name,
      position: form.position,
      payType: form.payType,
      product: form.product,
      count: Number(form.count || 0),
      points: Number(form.points || 0),
      attendance: form.attendance,
      memo: form.memo,
    };

    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    setRecords((prev) => [
      ...prev,
      { ...payload, revenue: previewRevenue },
    ]);

    setMessage("保存OK！");
    setSaving(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>売上入力</h2>

      <input type="date" value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })} />

      <select value={form.base}
        onChange={(e) => setForm({ ...form, base: e.target.value })}>
        {settings.bases.map((b) => <option key={b}>{b}</option>)}
      </select>

      <select value={form.memberId}
        onChange={(e) => handleMemberChange(e.target.value)}>
        <option value="">選択して</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      {/* ★ここが追加したやつ */}
      <select value={form.payType}
        onChange={(e) => setForm({ ...form, payType: e.target.value })}>
        <option value="完全歩合">完全歩合</option>
        <option value="固定">固定</option>
        <option value="固定＋インセン">固定＋インセン</option>
      </select>

      <select value={form.product}
        onChange={(e) => setForm({ ...form, product: e.target.value })}>
        {productOptions.map((p) => <option key={p}>{p}</option>)}
      </select>

      <input
        type="number"
        placeholder="件数"
        value={form.count}
        onChange={(e) => setForm({ ...form, count: e.target.value })}
      />

      <input
        type="number"
        placeholder="ポイント"
        value={form.points}
        onChange={(e) => setForm({ ...form, points: e.target.value })}
      />

      <label>
        <input type="checkbox"
          checked={form.attendance}
          onChange={(e) => setForm({ ...form, attendance: e.target.checked })}/>
        出勤
      </label>

      <button onClick={handleSave}>
        保存
      </button>

      <div>予定売上：{previewRevenue}円</div>
      <div>{message}</div>
    </div>
  );
}
