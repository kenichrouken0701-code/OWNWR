import React, { useEffect, useMemo, useState } from "react";
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  Users, 
  Briefcase, 
  CreditCard, 
  FileText, 
  PlusCircle, 
  CheckCircle2,
  History,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    fetch(GAS_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.members || []);
          setSettings(data.settings || defaultSettings);
        }
      })
      .catch(() => {
        setMessage("データ取得に失敗しました。オフラインモードで動作します。");
      })
      .finally(() => {
        setIsLoading(false);
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
      position: member?.position || prev.position,
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
      // Use no-cors for GAS as provided in the snippet
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

      // Auto-clear message
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setMessage("保存に失敗しました。GASのURLや権限を確認してください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] selection:bg-blue-100 pb-12">
      <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div className="w-full md:w-auto text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">350万オーナーダッシュボード</h1>
            <p className="text-slate-500 font-medium">今月の売上を積み上げ、独立基準を可視化する</p>
          </div>
          <div className="text-center md:text-right w-full md:w-auto">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-1 shadow-sm border border-blue-200">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </span>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Independence Roadmap</div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="現在の売上合計" 
            value={totalRevenue} 
            suffix="円" 
            borderColor="border-blue-500"
            textColor="text-blue-600"
            delay={0.1}
          />
          <StatCard 
            title="目標まで残り" 
            value={remaining} 
            suffix="円" 
            borderColor="border-emerald-500"
            subText={`目標：${target.toLocaleString()}円`}
            delay={0.2}
          />
          <div className="bg-white rounded-[1.25rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-6 border-l-8 border-indigo-500 flex flex-col justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-wider">達成率</p>
              <h2 className="text-4xl font-black text-slate-800">{achievement.toFixed(1)}<span className="text-2xl ml-1">%</span></h2>
            </div>
            <div className="bg-[#e2e8f0] rounded-full h-3 overflow-hidden mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${achievement}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Input Form */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100"
            >
              <h3 className="text-xl font-black mb-8 flex items-center text-slate-800">
                <span className="w-2.5 h-7 bg-blue-500 rounded-full mr-4 shadow-sm shadow-blue-200"></span>
                売上データ入力
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* Date Input */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">日付</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Base Selection */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">拠点選択</label>
                  <select
                    value={form.base}
                    onChange={(e) => handleBaseChange(e.target.value)}
                    className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    {settings.bases.map((base) => (
                      <option key={base} value={base}>{base}</option>
                    ))}
                  </select>
                </div>

                {/* Member Name */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">担当メンバー</label>
                  <select
                    value={form.memberId}
                    onChange={(e) => handleMemberChange(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all disabled:opacity-50 appearance-none"
                  >
                    <option value="">{isLoading ? "読み込み中..." : "選択してください"}</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">商材タイプ</label>
                  <select
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    {productOptions.map((product) => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>

                {/* Count or Points */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
                    {form.base === "すまえる" ? "獲得件数" : "獲得ポイント"}
                  </label>
                  <input
                    type="number"
                    step={form.base === "すまえる" ? "1" : "0.1"}
                    value={form.base === "すまえる" ? form.count : form.points}
                    onChange={(e) => {
                      if (form.base === "すまえる") {
                        setForm({ ...form, count: e.target.value });
                      } else {
                        setForm({ ...form, points: e.target.value });
                      }
                    }}
                    placeholder={form.base === "すまえる" ? "例: 3" : "例: 1.5"}
                    className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Attendance */}
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.attendance}
                      onChange={(e) => setForm({ ...form, attendance: e.target.checked })}
                      className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">当日の出勤あり</span>
                  </label>
                </div>
              </div>

              {/* Memo */}
              <div className="mb-8 space-y-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">備考・メモ</label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="現場の状況など..."
                  className="w-full h-24 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[0.75rem] p-3 font-semibold text-slate-700 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-50">
                <div className="bg-slate-100 px-6 py-3 rounded-2xl w-full sm:w-auto text-center sm:text-left border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider mb-1">反映予定売上額</span>
                  <span className="text-2xl font-black text-slate-800">¥{previewRevenue.toLocaleString()}</span>
                </div>

                <div className="w-full sm:w-auto flex flex-col items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-64 bg-[#1e293b] hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "スプレッドシートへ保存"
                    )}
                  </button>
                  <AnimatePresence>
                    {message && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs font-bold ${message.includes("失敗") ? 'text-rose-500' : 'text-emerald-500'}`}
                      >
                        {message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Activity Feed */}
          <div className="lg:col-span-5 self-stretch">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f172a] rounded-[2rem] shadow-xl p-8 text-white h-full flex flex-col border border-slate-800 shadow-slate-300/20"
            >
              <h3 className="text-xl font-black mb-8 flex items-center">
                <span className="w-2.5 h-7 bg-blue-400 rounded-full mr-4 shadow-sm shadow-blue-900"></span>
                最近の入力履歴
              </h3>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {records.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 translate-y-[-10%]">
                    <History size={48} className="mb-4 opacity-10" />
                    <p className="text-sm font-bold opacity-60">まだ履歴がありません</p>
                  </div>
                ) : (
                  records.slice().reverse().map((record, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 flex justify-between items-center hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <div className="text-[10px] font-black text-blue-400 mb-1">{record.date} 稼働</div>
                        <div className="font-black text-slate-100">{record.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {record.product} ({record.base})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">+¥{record.revenue.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-400 font-black uppercase flex items-center justify-end gap-1">
                          <CheckCircle2 size={10} /> Saved
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700">
                  <p className="text-[11px] text-slate-500 font-bold">全ての履歴はGoogleスプレッドシートで管理されています</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  suffix, 
  borderColor,
  textColor = "text-slate-800",
  subText,
  delay 
}: { 
  title: string; 
  value: number | string; 
  suffix: string; 
  borderColor: string;
  textColor?: string;
  subText?: string;
  delay: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-[1.25rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-6 border-l-8 ${borderColor} transition-transform hover:scale-[1.02]`}
    >
      <p className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-wider">{title}</p>
      <h2 className={`text-3xl font-black text-slate-800 break-all`}>
        {typeof value === 'number' ? `¥${value.toLocaleString()}` : value + suffix}
      </h2>
      {subText && <p className="text-slate-500 text-xs font-medium mt-2">{subText}</p>}
      {title === "現在の売上合計" && value !== 0 && (
        <p className={`${textColor} text-xs font-black mt-2 flex items-center gap-1`}>
          <TrendingUp size={12} /> 順調に積み上げ中
        </p>
      )}
    </motion.div>
  );
}

