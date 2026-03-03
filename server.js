const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 【修正】Staging環境のURLに変更
const ENECHANGE_API_URL = 'https://stg-emap-api.enechange.jp/simulation/v2/elec';
// 【修正】新しいAPIキーに変更
const ENECHANGE_API_KEY = 'r7jCwxyBGThxS6EHvfmqFe9eSssfiePg';

app.post('/api/simulate', async (req, res) => {
  try {
    const { postcode, currentPlanCode, amperage, month, bill } = req.body;

    const monthly_values = Array(12).fill("");
    monthly_values[month - 1] = String(bill);

    const currentYear = new Date().getFullYear();
    const latestYearMonth = `${currentYear}${String(month).padStart(2, '0')}`;

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
          "czkxj|hzozmtmvoztgdbcodibtw-czkxj",
          "nvhkgzvbvn|hzozmtmvoztgdbcodibtw-czkxj",
          "nvhkgzvbvn|hzozmtmvoztgdbcodibtwtb-czkxj"
        ],
        contract_ampere: amperage,
        unit_type: 1,
        power_factor: 85,
        monthly_type: 2,
        monthly_values: monthly_values,
        latest_year_month: latestYearMonth,
        use_profiler: true,
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
