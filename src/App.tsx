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

const GAS_URL = "https://script.google.com/macros/s/AKfycbwjikjR7Fk-mrKGcQ6si9BV0Ix5NOPaTZYUPIOgY4QxKYyTVebS8_UX3qGWh4vnPdsiSQ/exec";

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<Settings>({
    bases: ["すまえる", "地域創生"],
    products: { 電気: 300, ガス: 300, 回線: 6000, ウォーター: 6000 },
    pointUnit: 13000,
    monthlyFixed: 158000,
    workingDays: 22,
    dailyWage: 158000 / 22,
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    base: "すまえる",
    memberId: "",
    name: "",
    position: "",
    payType: "完全歩合",
    product: "電気",
    count: "",
    points: "",
    attendance: false,
    memo: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(GAS_URL)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMembers(data.members);
          setSettings(data.settings);
        }
      });
  }, []);

  const handleMember = (id: string) => {
    const m = members.find(x => x.id === id);
    setForm({ ...form, memberId: id, name: m?.name || "", position: m?.position || "" });
  };

  const revenue = useMemo(() => {
    let incentive = 0;

    if (form.base === "すまえる") {
      incentive = Number(form.count || 0) * (settings.products[form.product] || 0);
    } else {
      incentive = Number(form.points || 0) * settings.pointUnit;
    }

    let fixed = 0;
    if (form.attendance && (form.payType === "固定" || form.payType === "固定＋インセン")) {
      fixed = settings.dailyWage;
    }

    return Math.round(incentive + fixed);
  }, [form, settings]);

  const save = async () => {
    if (!form.name) {
      setMessage("メンバー選択して");
      return;
    }

    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(form),
    });

    setMessage("保存OK");
  };

  return (
    <div style={{ padding: 30, fontFamily: "sans-serif" }}>
      <h1>350万ダッシュボード</h1>

      <input type="date" value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })} />

      <select value={form.base}
        onChange={e => setForm({ ...form, base: e.target.value })}>
        {settings.bases.map(b => <option key={b}>{b}</option>)}
      </select>

      <select value={form.memberId} onChange={e => handleMember(e.target.value)}>
        <option value="">メンバー選択</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      {/* ★ここが修正ポイント */}
      <select value={form.payType}
        onChange={e => setForm({ ...form, payType: e.target.value })}>
        <option>完全歩合</option>
        <option>固定</option>
        <option>固定＋インセン</option>
      </select>

      <select value={form.product}
        onChange={e => setForm({ ...form, product: e.target.value })}>
        <option>電気</option>
        <option>ガス</option>
        <option>回線</option>
        <option>ウォーター</option>
      </select>

      <input placeholder="件数"
        onChange={e => setForm({ ...form, count: e.target.value })} />

      <input placeholder="ポイント"
        onChange={e => setForm({ ...form, points: e.target.value })} />

      <label>
        <input type="checkbox"
          onChange={e => setForm({ ...form, attendance: e.target.checked })} />
        出勤
      </label>

      <button onClick={save}>保存</button>

      <h2>¥{revenue}</h2>
      <p>{message}</p>
    </div>
  );
}
