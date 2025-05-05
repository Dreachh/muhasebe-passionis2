import { addData, clearStore, updateData } from "./db";

export async function loadSampleData() {
  // Finansal veriler
  const finance = require("../data/sample-finance.json");
  await clearStore("financials");
  for (const exp of finance.expenses) {
    await addData("financials", { ...exp, type: "expense" });
  }
  for (const inc of finance.incomes) {
    await addData("financials", { ...inc, type: "income" });
  }

  // Tur satışları
  const tours = require("../data/sample-tours.json");
  await clearStore("tours");
  for (const tour of tours) {
    await addData("tours", tour);
  }

  // Aktiviteler
  const activities = require("../data/sample-activities.json");
  await clearStore("activities");
  for (const act of activities) {
    await addData("activities", act);
  }

  // Destinasyonlar
  const destinations = require("../data/sample-destinations.json");
  await clearStore("destinations");
  for (const dest of destinations) {
    await addData("destinations", dest);
  }

  // Ayarlar
  const settings = require("../data/sample-settings.json");
  await clearStore("settings");
  if (Array.isArray(settings)) {
    for (const setting of settings) {
      if (!setting.id) setting.id = "settings";
      await updateData("settings", setting);
    }
  } else {
    if (!settings.id) settings.id = "settings";
    await updateData("settings", settings);
  }
}

