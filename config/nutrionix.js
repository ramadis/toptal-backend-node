function getCalories(meal) {
  return new Promise(function(res, rej) {
    const api = "https://trackapi.nutritionix.com/v2/natural/nutrients";
    const response = fetch(api, {
      method: "POST",
      body: JSON.stringify({
        query: meal.description
      })
    });

    response.then(raw => (raw.ok ? raw.json() : null)).then(nutrients => {
      if (!nutrients) return res(null);
      if (nutrients.foods.length < 1) return res(null);
      if (typeof nutrients.foods[0].nf_calories === "undefined") return res(null);
      return res(nutrients.foods[0].nf_calories);
    });
  });
}

module.exports = getCalories;
