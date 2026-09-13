'use client';

import { useEffect, useState } from 'react';

export function WeatherLab() {
  const [celsius, setCelsius] = useState(20);
  const [fahrenheit, setFahrenheit] = useState(68);

  useEffect(() => {
    const id = setTimeout(() => {
      setFahrenheit(celsius * 1.8 + 32);
    }, 0);
    return () => clearTimeout(id);
  }, [celsius]);

  return (
    <section className="card">
      <h2>Weather (extra frame)</h2>
      <input
        type="number"
        value={celsius}
        onChange={(e) => setCelsius(Number(e.target.value))}
      />
      <p>{celsius}°C → {fahrenheit}°F</p>
    </section>
  );
}