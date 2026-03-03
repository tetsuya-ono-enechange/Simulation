const express = require('express');
const fetch = require('node-fetch'); // Node v18以降は標準のfetchが利用可能です
const app = express();

app.use(express.json());
app.use(express.static('public')); // publicフォルダにindex.htmlを配置

// ENECHANGE APIのエンドポイント
const ENECHANGE_API_URL = 'https://emap-api.enechange.jp/simulation/v2/set/electricGasSimulation';

// ご指定いただいたAPIキーを設定
const ENECHANGE_API_KEY = 'hvvLCbxFWwjJTRVt1zA15IqAwNYzy3rZ';

app.post('/api/simulate', async (req, res) => {
  try {
    const { postalCode, amperage, month, bill } = req.body;

    // ----------------------------------------------------------------------
    // 【修正が必要な箇所】
    // 以下のJSON構造（apiPayload）は推測に基づく仮のものです。
    // 実際の仕様書（Request bodyのスキーマ）に合わせてプロパティ名を変更してください。
    // ----------------------------------------------------------------------
    const apiPayload = {
      postal_code: postalCode,
      current_contract: {
        energy_type: "electric", 
        amperage: amperage,
        target_month: month,
        monthly_bill: bill,
        // current_provider_id: 123, // 必須パラメータがあれば追加
        // current_plan_id: 456      // 必須パラメータがあれば追加
      }
    };

    // ENECHANGE APIをコール
    const enechangeResponse = await fetch(ENECHANGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // APIの認証仕様に合わせてヘッダー名を変更してください。
        // よくあるパターン： 'Authorization': `Bearer ${ENECHANGE_API_KEY}`, または 'x-api-key': ENECHANGE_API_KEY
        'x-api-key': ENECHANGE_API_KEY
      },
      body: JSON.stringify(apiPayload)
    });

    const responseData = await enechangeResponse.json();

    if (!enechangeResponse.ok) {
      console.error('API Error Details:', responseData);
      return res.status(enechangeResponse.status).json({ 
        error: 'エネチェンジAPIからエラーが返却されました。',
        details: responseData 
      });
    }

    // ----------------------------------------------------------------------
    // 【修正が必要な箇所】
    // 以下のJSONパス（responseData.xxx）も推測です。
    // 実際の仕様書（Responsesのスキーマ）に合わせて抽出パスを変更してください。
    // ----------------------------------------------------------------------
    const formattedData = {
      savingsAmount: responseData.annual_savings || 0,
      recommendedPlanName: responseData.recommended_plan?.name || "該当プランが見つかりませんでした",
    };

    // フロントエンドへ結果を返す
    res.json(formattedData);

  } catch (error) {
    console.error('Server Internal Error:', error);
    res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
