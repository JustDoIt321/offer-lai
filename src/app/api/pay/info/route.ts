import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    price: Number(process.env.PRICE_CNY || 39),
    contact: process.env.PAY_CONTACT || '请咨询管理员',
    note:
      process.env.PAY_NOTE ||
      '支付 ¥39 开通 1 个月会员后，请添加下方联系方式，提供你的注册邮箱，我们会为你手动开通会员。',
  });
}