'use client';

import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
}

interface PayInfo {
  price: number;
  contact: string;
  note: string;
}

export default function UpgradeModal({ open, onClose, userEmail }: Props) {
  const [info, setInfo] = useState<PayInfo>({ price: 39, contact: '', note: '' });

  useEffect(() => {
    if (!open) return;
    fetch('/api/pay/info')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">开通会员 · 畅享无限面试</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-center mb-4">
          <div className="text-sm text-gray-500">会员价格</div>
          <div className="text-3xl font-extrabold text-blue-600">¥{info.price}<span className="text-sm font-normal text-gray-400">/月</span></div>
          <div className="text-xs text-gray-500 mt-1">不限次数 · 所有面试类型 · 完整报告</div>
        </div>

        <ol className="text-sm text-gray-600 space-y-2 mb-4">
          <li>1️⃣ 通过支付宝/微信向管理员支付 <b>¥{info.price}</b></li>
          <li>2️⃣ 联系管理员，附上你的注册邮箱{userEmail ? `（当前账号：${userEmail}）` : ''}</li>
          <li>3️⃣ 确认后我们将立即为你开通会员</li>
        </ol>

        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 mb-4">
          <div className="font-medium text-gray-800 mb-1">{info.note}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-gray-500">联系方式：</span>
            <span className="font-semibold text-blue-700 break-all">{info.contact}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}