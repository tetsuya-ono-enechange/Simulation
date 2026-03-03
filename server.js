const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const ENECHANGE_API_URL = 'https://emap-api.enechange.jp/simulation/v2/elec';
const ENECHANGE_API_KEY = 'r7jCwxyBGThxS6EHvfmqFe9eSssfiePg';

app.post('/api/simulate', async (req, res) => {
  try {
    const { postcode, currentPlanCode, amperage, month, bill } = req.body;

    // API仕様に合わせて12ヶ月分の配列を作成
    // ※入力された月（1〜12）のインデックスに金額をセットし、それ以外は空文字にする
    // use_profiler: true が設定されているため、エネチェンジ側で欠損月の推計が行われます
    const monthly_values = Array(12).fill("");
    monthly_values[month - 1] = String(bill);

    // latest_year_monthの生成（例: 202310）
    const currentYear = new Date().getFullYear();
    const latestYearMonth = `${currentYear}${String(month).padStart(2, '0')}`;

    // サンプルに基づく完全なペイロード
    const apiPayload = {
      request_id: `req_${Date.now()}`,
      postcode: postcode,
      all_electric: false,
      weekday_night_usage_percentage: 75,
      holiday_night_usage_percentage: 55,
      number_of_family: 3,
      elec: {
        current_plan_code: currentPlanCode,
        target_plan_codes: [
          // 比較対象のプランコード（サンプル流用。通常はマスターデータ等から複数指定）
          "czkxj|hzozmtmvoztgdbcodibtw-czkxj",
          "nvhkgzvbvn|hzozmtmvoztgdbcodibtw-czkxj",
          "nvhkgzvbvn|hzozmtmvoztgdbcodibtwtb-czkxj"
        ],
        contract_ampere: amperage,
        unit_type: 1,
        power_factor: 85,
        monthly_type: 2, // 2 = 金額入力
        monthly_values: monthly_values,
        latest_year_month: latestYearMonth,
        use_profiler: true, // 推計プロファイラーを使用
        weekday_usage_percentage: 65,
        weekday_daytime_usage_percentage: 25,
        holiday_daytime_usage_percentage: 25,
        daytime_from: 8,
        nighttime_from: 20,
        profiler_options: null
      }
    };

    const enechangeResponse = await fetch(ENECHANGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENECHANGE_API_KEY
      },
      body: JSON.stringify(apiPayload)
    });

    const responseData = await enechangeResponse.json();

    if (!enechangeResponse.ok) {
      console.error('API Error:', responseData);
      return res.status(enechangeResponse.status).json({ error: 'APIエラー', details: responseData });
    }

    // --------------------------------------------------
    // レスポンスの解析 (サンプルの "target_plans" 配列から一番目の結果を取得)
    // --------------------------------------------------
    if (!responseData.target_plans || responseData.target_plans.length === 0) {
      return res.status(404).json({ error: 'シミュレーション可能なプランが見つかりませんでした。' });
    }

    // 一番節約額が大きいプランを探す、または1件目を返すなど要件に応じて調整
    const bestPlan = responseData.target_plans[0].elec;

    res.json({
      targetPlanName: `${bestPlan.provider_name} - ${bestPlan.plan_name}`,
      yearSaving: bestPlan.year_saving || 0
    });

  } catch (error) {
    console.error('Server Internal Error:', error);
    res.status(500).json({ error: 'サーバー内部エラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
