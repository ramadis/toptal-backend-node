var fetch = require('node-fetch');

function getCalories(meal) {
  return new Promise(function(res, rej) {
    var appID = '5f20e952';
    var apiKey = 'e57286a60f0f1cc392ef4ee1540eef7f';
    const api = "https://trackapi.nutritionix.com/v2/natural/nutrients";
    const response = fetch(api, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "x-app-id": appID,
        "x-app-key": apiKey
      },
      body: JSON.stringify({
        query: meal.text
      })
    });

    response.then(raw => (raw.ok ? raw.json() : null)).then(nutrients => {
      if (!nutrients) return res(null);
      if (nutrients.foods.length < 1) return res(null);
      if (typeof nutrients.foods[0].nf_calories === "undefined") return res(null);
      return res(Math.floor(nutrients.foods[0].nf_calories));
    });
  });
}

module.exports = getCalories;
