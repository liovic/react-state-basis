'use client';

import { useState } from 'react';

export function StatusLab() {
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [hasData, setHasData] = useState(false);

  function load() {
    setLoading(true);
    setSuccess(false);
    setHasData(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setHasData(true);
    }, 400);
  }

  return (
    <section className="card">
      <h2>Status flags (correlated)</h2>
      <button type="button" onClick={load}>
        Fetch
      </button>
      <p>
        loading={String(isLoading)} success={String(isSuccess)} hasData=
        {String(hasData)}
      </p>
    </section>
  );
}