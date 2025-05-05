import { useEffect } from "react";
import { loadSampleData } from "../lib/load-sample-data";

export default function AppLoadSampleData() {
  useEffect(() => {
    // Sadece ilk açılışta bir kere yükle
    if (!window.localStorage.getItem("sampleDataLoaded")) {
      loadSampleData().then(() => {
        window.localStorage.setItem("sampleDataLoaded", "1");
      });
    }
  }, []);
  return null;
}
