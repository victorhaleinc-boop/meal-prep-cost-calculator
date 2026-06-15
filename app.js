const ingredientBody = document.getElementById("ingredientBody");
const rowTemplate = document.getElementById("ingredientRowTemplate");

const inputs = {
  recipeName: document.getElementById("recipeName"),
  servings: document.getElementById("servings"),
};

const outputs = {
  totalCost: document.getElementById("totalCost"),
  costPerServing: document.getElementById("costPerServing"),
  totalCalories: document.getElementById("totalCalories"),
  caloriesPerServing: document.getElementById("caloriesPerServing"),
  totalProtein: document.getElementById("totalProtein"),
  proteinPerServing: document.getElementById("proteinPerServing"),
  totalCarbs: document.getElementById("totalCarbs"),
  carbsPerServing: document.getElementById("carbsPerServing"),
  totalFat: document.getElementById("totalFat"),
  fatPerServing: document.getElementById("fatPerServing"),
  costBreakdown: document.getElementById("costBreakdown"),
  groceryRollup: document.getElementById("groceryRollup"),
  summaryText: document.getElementById("summaryText"),
  summaryOutput: document.getElementById("summaryOutput"),
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const whole = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function readNumber(input) {
  return Number.parseFloat(input.value || "0") || 0;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function addRow(values = {}) {
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".ingredient-row");
  row.querySelector('[data-field="name"]').value = values.name || "";
  row.querySelector('[data-field="quantity"]').value = values.quantity ?? "";
  row.querySelector('[data-field="unit"]').value = values.unit || "unit";
  row.querySelector('[data-field="cost"]').value = values.cost ?? "";
  row.querySelector('[data-field="calories"]').value = values.calories ?? "";
  row.querySelector('[data-field="protein"]').value = values.protein ?? "";
  row.querySelector('[data-field="carbs"]').value = values.carbs ?? "";
  row.querySelector('[data-field="fat"]').value = values.fat ?? "";
  ingredientBody.appendChild(fragment);
  return row;
}

function collectRows() {
  return Array.from(document.querySelectorAll(".ingredient-row")).map((row) => {
    const field = (name) => row.querySelector(`[data-field="${name}"]`);
    return {
      name: field("name").value.trim(),
      quantity: readNumber(field("quantity")),
      unit: field("unit").value,
      cost: readNumber(field("cost")),
      calories: readNumber(field("calories")),
      protein: readNumber(field("protein")),
      carbs: readNumber(field("carbs")),
      fat: readNumber(field("fat")),
    };
  });
}

function renderEmptyState(target, message) {
  target.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function calculate() {
  const servings = Math.max(1, Math.round(readNumber(inputs.servings)));
  const recipeName = inputs.recipeName.value.trim() || "This meal prep batch";
  const rows = collectRows().filter((row) => {
    return (
      row.name ||
      row.quantity ||
      row.cost ||
      row.calories ||
      row.protein ||
      row.carbs ||
      row.fat
    );
  });

  const totals = rows.reduce(
    (sum, row) => {
      sum.cost += row.cost;
      sum.calories += row.calories;
      sum.protein += row.protein;
      sum.carbs += row.carbs;
      sum.fat += row.fat;
      return sum;
    },
    { cost: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  outputs.totalCost.textContent = money.format(totals.cost);
  outputs.costPerServing.textContent = money.format(totals.cost / servings);
  outputs.totalCalories.textContent = whole.format(totals.calories);
  outputs.caloriesPerServing.textContent = whole.format(totals.calories / servings);
  outputs.totalProtein.textContent = `${decimal.format(totals.protein)}g`;
  outputs.proteinPerServing.textContent = `${decimal.format(totals.protein / servings)}g`;
  outputs.totalCarbs.textContent = `${decimal.format(totals.carbs)}g`;
  outputs.carbsPerServing.textContent = `${decimal.format(totals.carbs / servings)}g`;
  outputs.totalFat.textContent = `${decimal.format(totals.fat)}g`;
  outputs.fatPerServing.textContent = `${decimal.format(totals.fat / servings)}g`;

  renderCostBreakdown(rows, totals.cost);
  renderGroceryRollup(rows);

  outputs.summaryText.textContent =
    `${recipeName} makes ${servings} serving${servings === 1 ? "" : "s"} at ` +
    `${money.format(totals.cost / servings)} per serving with ` +
    `${whole.format(totals.calories / servings)} calories, ${decimal.format(totals.protein / servings)}g protein, ` +
    `${decimal.format(totals.carbs / servings)}g carbs, and ${decimal.format(totals.fat / servings)}g fat.`;

  outputs.summaryOutput.value =
    `${recipeName}\n` +
    `Servings: ${servings}\n` +
    `Total batch cost: ${money.format(totals.cost)}\n` +
    `Cost per serving: ${money.format(totals.cost / servings)}\n` +
    `Total macros: ${whole.format(totals.calories)} cal | ${decimal.format(totals.protein)}g protein | ` +
    `${decimal.format(totals.carbs)}g carbs | ${decimal.format(totals.fat)}g fat\n` +
    `Macros per serving: ${whole.format(totals.calories / servings)} cal | ${decimal.format(totals.protein / servings)}g protein | ` +
    `${decimal.format(totals.carbs / servings)}g carbs | ${decimal.format(totals.fat / servings)}g fat`;
}

function renderCostBreakdown(rows, totalCost) {
  if (!rows.length || totalCost <= 0) {
    renderEmptyState(outputs.costBreakdown, "Add ingredient costs to see which items drive the batch price.");
    return;
  }

  const sorted = [...rows].sort((left, right) => right.cost - left.cost);
  outputs.costBreakdown.innerHTML = sorted
    .map((row) => {
      const label = row.name || "Unnamed ingredient";
      const share = totalCost > 0 ? (row.cost / totalCost) * 100 : 0;
      return (
        `<article class="stack-item">` +
        `<div><strong>${escapeHtml(label)}</strong><span>${money.format(row.cost)} used</span></div>` +
        `<p>${decimal.format(share)}% of the batch cost</p>` +
        `</article>`
      );
    })
    .join("");
}

function renderGroceryRollup(rows) {
  if (!rows.length) {
    renderEmptyState(outputs.groceryRollup, "Add ingredients to build a simple grocery rollup for this batch.");
    return;
  }

  const groups = new Map();
  for (const row of rows) {
    const label = row.name || "Unnamed ingredient";
    const key = `${label.toLowerCase()}::${row.unit}`;
    if (!groups.has(key)) {
      groups.set(key, {
        label,
        unit: row.unit,
        quantity: 0,
        cost: 0,
      });
    }
    const current = groups.get(key);
    current.quantity += row.quantity;
    current.cost += row.cost;
  }

  outputs.groceryRollup.innerHTML = Array.from(groups.values())
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((item) => {
      const quantityText = item.quantity > 0 ? `${decimal.format(item.quantity)} ${item.unit}` : `Unit not entered`;
      return (
        `<article class="stack-item">` +
        `<div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(quantityText)}</span></div>` +
        `<p>${money.format(item.cost)} allocated to this batch</p>` +
        `</article>`
      );
    })
    .join("");
}

document.getElementById("addIngredient").addEventListener("click", () => {
  addRow();
  calculate();
});

ingredientBody.addEventListener("input", calculate);
ingredientBody.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-row");
  if (!button) {
    return;
  }
  button.closest(".ingredient-row").remove();
  if (!document.querySelector(".ingredient-row")) {
    seedRows();
  }
  calculate();
});

inputs.recipeName.addEventListener("input", calculate);
inputs.servings.addEventListener("input", calculate);

document.getElementById("copySummary").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(outputs.summaryOutput.value);
  } catch (_) {
    outputs.summaryOutput.select();
    document.execCommand("copy");
  }
});

function seedRows() {
  addRow({
    name: "Chicken breast",
    quantity: 2,
    unit: "lb",
    cost: 8.5,
    calories: 960,
    protein: 184,
    carbs: 0,
    fat: 20,
  });
  addRow({
    name: "Jasmine rice",
    quantity: 2,
    unit: "cup",
    cost: 1.6,
    calories: 1280,
    protein: 24,
    carbs: 284,
    fat: 2,
  });
  addRow({
    name: "Broccoli",
    quantity: 12,
    unit: "oz",
    cost: 2.8,
    calories: 120,
    protein: 10,
    carbs: 24,
    fat: 1,
  });
  addRow({
    name: "Teriyaki sauce",
    quantity: 0.5,
    unit: "cup",
    cost: 1.4,
    calories: 140,
    protein: 2,
    carbs: 30,
    fat: 0,
  });
}

seedRows();
calculate();
