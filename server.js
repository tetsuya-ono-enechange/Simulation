const express = require('express');
const fetch = require('node-fetch'); // Node v18以降は標準のfetchが使えます
const app = express();

app.use(express.json());
app.use(express.static('public')); // publicフォルダにindex.htmlを配置

// ENECHANGE APIのエンドポイント（仕様書のBase URLに書き換えてください）
const ENECHANGE_API_URL = 'https://emap-api.enechange.jp/simulation/v2/set/electricGasSimulation';
const ENECHANGE_API_KEY = 'YOUR_API_KEY_HERE'; // 払い出された認証トークン等を設定

app.post('/api/simulate', async (req, res) => {
  try {
    const { postalCode, amperage, month, bill } = req.body;

    // ENECHANGE仕様書「electricGasSimulation」のSchemaに合わせてPayloadを組み立てます。
    // ※ 以下のプロパティ名は推測値です。実際のAPI仕様書に記載されているJSONキー名（スネークケースやキャメルケース）に合わせて修正してください。
    const apiPayload = {
      postal_code: postalCode,
      current_contract: {
        energy_type: "electric", // または電気ガスのセット設定
        amperage: amperage,
        target_month: month,
        monthly_bill: bill,
        // 現在の電力会社IDやプランIDが必須項目になっている場合は、デフォルト値等を設定する必要があります
        // provider_id: 123, 
        // plan_id: 456
      }
    };

    // APIをコール
    const enechangeResponse = await fetch(ENECHANGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENECHANGE_API_KEY}`, // 認証の仕様に合わせて設定（x-api-key等の場合もあり）
      },
      body: JSON.stringify(apiPayload)
    });

    const responseData = await enechangeResponse.json();

    if (!enechangeResponse.ok) {
      console.error('API Error:', responseData);
      return res.status(enechangeResponse.status).json({ error: 'エネチェンジAPIエラー' });
    }

    // フロントエンドが必要とするデータを抽出・加工して返却
    // ※ 仕様書のレスポンス形式に合わせてパス（responseData.xxx.yyy）を変更してください。
    const formattedData = {
      savingsAmount: responseData.annual_savings || 0,
      recommendedPlanName: responseData.recommended_plan?.name || "おすすめプラン",
    };

    res.json(formattedData);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
