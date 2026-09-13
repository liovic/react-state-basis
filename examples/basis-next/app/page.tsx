'use client';

import { ContextMirrorLab } from "./labs/ContextMirrorLab";
import { StatusLab } from "./labs/StatusLab";
import { WeatherLab } from "./labs/WeatherLab";

export default function Page() {
  return (
    <main className="labs">
      <h1>Basis Next labs</h1>
      <p>Click around, then check the HUD and console.</p>
      <WeatherLab />
      <StatusLab />
      <ContextMirrorLab />
    </main>
  );
}