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

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwjikjR7Fk-mrKGcQ6si9BV0Ix5NOPaTZYUPIOgY4QxKYyTVebS8_UX3qGWh4vnPdsiSQ/exec";

const defaultSettings: Settings = {
  bases: ["すまえる", "地域創生"],
  products: {
    電気: 300,
    ガス: 300,
    回線: 6000,
    ウォーター: 6000,
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
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    date: today,
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

  useEffect(() => {
    fetch(GAS_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.members || []);
          setSettings(data.settings || defaultSettings);
        }
      })
      .catch(() => {
        setMessage("データ取得に失敗しました。GASを確認してください。");
      })
      .finally(() => setLoading(false));
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

  const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
  const target = 3500000;
  const achievement = Math.min((totalRevenue / target) * 100, 100);
  const remaining = Math.max(target - totalRevenue, 0);

  const handleMemberChange = (id: string) => {
    const member = members.find((m) => m.id === id);

    setForm((prev) => ({
      ...prev,
      memberId: id,
      name: member?.name || "",
      position: member?.position || "",
    }));
  };

  const handleBaseChange = (base: string) => {
    setForm((prev) => ({
      ...prev,
      base,
      product: base === "地域創生" ? "法人電気" : "電気",
      count: "",
      points: "",
    }));
  };

  const handleSave = async () => {
    if (!form.name) {
      setMessage("メンバーを選択してください。");
      return;
    }

    setSaving(true);
    setMessage("");

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

    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      setRecords((prev) => [
        ...prev,
        {
          ...payload,
          revenue: previewRevenue,
        },
      ]);

      setMessage("スプレッドシートに保存しました！");

      setForm((prev) => ({
        ...prev,
        count: "",
        points: "",
        attendance: false,
        memo: "",
      }));
    } catch (error) {
      setMessage("保存に失敗しました。GASのURLや権限を確認してください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              350万オーナーダッシュボード
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              売上を入力して、独立基準までの距離を見える化
            </p>
          </div>
          <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
            目標：3,500,000円
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border-l-8 border-blue-500 bg-white p-6 shadow-lg">
            <p className="text-xs font-black text-slate-400">今回入力分売上</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              ¥{totalRevenue.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-3xl border-l-8 border-emerald-500 bg-white p-6 shadow-lg">
            <p className="text-xs font-black text-slate-400">目標まで残り</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              ¥{remaining.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-3xl border-l-8 border-indigo-500 bg-white p-6 shadow-lg">
            <p className="text-xs font-black text-slate-400">達成率</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              {achievement.toFixed(1)}%
            </h2>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                style={{ width: `${achievement}%` }}
              />
            </div>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="rounded-[2rem] bg-white p-6 shadow-xl lg:col-span-7 md:p-8">
            <h2 className="mb-6 flex items-center text-xl font-black text-slate-900">
              <span className="mr-3 h-8 w-2 rounded-full bg-blue-500" />
              売上データ入力
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="日付">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input"
                />
              </Field>

              <Field label="拠点選択">
                <select
                  value={form.base}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  className="input"
                >
                  {settings.bases.map((base) => (
                    <option key={base} value={base}>
                      {base}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="担当メンバー">
                <select
                  value={form.memberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  <option value="">
                    {loading ? "読み込み中..." : "選択してください"}
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="報酬形態">
                <select
                  value={form.payType}
                  onChange={(e) =>
                    setForm({ ...form, payType: e.target.value })
                  }
                  className="input"
                >
                  <option value="完全歩合">完全歩合</option>
                  <option value="固定">固定</option>
                  <option value="固定＋インセン">固定＋インセン</option>
                </select>
              </Field>

              <Field label="商材タイプ">
                <select
                  value={form.product}
                  onChange={(e) =>
                    setForm({ ...form, product: e.target.value })
                  }
                  className="input"
                >
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </Field>

              {form.base === "すまえる" ? (
                <Field label="獲得件数">
                  <input
                    type="number"
                    value={form.count}
                    onChange={(e) =>
                      setForm({ ...form, count: e.target.value })
                    }
                    placeholder="例：3"
                    className="input"
                  />
                </Field>
              ) : (
                <Field label="獲得ポイント">
                  <input
                    type="number"
                    step="0.1"
                    value={form.points}
                    onChange={(e) =>
                      setForm({ ...form, points: e.target.value })
                    }
                    placeholder="例：1.5"
                    className="input"
                  />
                </Field>
              )}

              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 font-black text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.attendance}
                    onChange={(e) =>
                      setForm({ ...form, attendance: e.target.checked })
                    }
                    className="h-5 w-5"
                  />
                  当日の出勤あり
                </label>
              </div>
            </div>

            <div className="mt-5">
              <Field label="備考・メモ">
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="現場の状況など..."
                  className="input min-h-24 resize-none"
                />
              </Field>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="rounded-2xl bg-slate-100 px-6 py-4">
                <p className="text-xs font-black text-slate-500">
                  反映予定売上額
                </p>
                <p className="text-3xl font-black text-slate-900">
                  ¥{previewRevenue.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-2xl bg-slate-900 px-10 py-4 font-black text-white shadow-lg transition hover:bg-slate-700 disabled:opacity-50 md:w-72"
                >
                  {saving ? "保存中..." : "スプレッドシートへ保存"}
                </button>
                {message && (
                  <p className="text-sm font-black text-emerald-600">
                    {message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl lg:col-span-5 md:p-8">
            <h2 className="mb-6 flex items-center text-xl font-black">
              <span className="mr-3 h-8 w-2 rounded-full bg-blue-400" />
              最近の入力履歴
            </h2>

            {records.length === 0 ? (
              <div className="flex min-h-96 items-center justify-center text-center text-slate-500">
                <div>
                  <p className="text-5xl">↺</p>
                  <p className="mt-3 text-sm font-bold">まだ履歴がありません</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {records
                  .slice()
                  .reverse()
                  .map((record, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                    >
                      <p className="text-xs font-black text-blue-400">
                        {record.date}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <p className="font-black">{record.name}</p>
                          <p className="text-xs text-slate-400">
                            {record.base} / {record.product} / {record.payType}
                          </p>
                        </div>
                        <p className="text-lg font-black">
                          +¥{record.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs font-bold text-slate-500">
              全ての履歴はGoogleスプレッドシートで管理されています
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.9rem 1rem;
          font-weight: 700;
          color: #334155;
          outline: none;
        }
        .input:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
