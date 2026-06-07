import React, { useEffect, useMemo, useState } from "react";

export default function CityStateAutocomplete({ value, onChange }) {
  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedUF = useMemo(() => {
    const normalized = (value?.state || "").trim().toLowerCase();

    return (
      ufs.find((u) => u.sigla.toLowerCase() === normalized) ||
      ufs.find((u) => u.nome.toLowerCase() === normalized) ||
      null
    );
  }, [value?.state, ufs]);

  // Buscar UFs
  useEffect(() => {
    (async () => {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
      );
      const data = await res.json();
      data.sort((a, b) => a.nome.localeCompare(b.nome));
      setUfs(data);
    })();
  }, []);

  // Buscar cidades quando UF mudar
  useEffect(() => {
    (async () => {
      if (!selectedUF?.id) {
        setCities([]);
        onChange?.({
          city: "",
          state: value?.state || "",
        });
        return;
      }

      setLoadingCities(true);
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF.id}/municipios`
        );
        const data = await res.json();
        data.sort((a, b) => a.nome.localeCompare(b.nome));
        setCities(data);
      } finally {
        setLoadingCities(false);
      }

      // Reseta cidade ao trocar estado
      onChange?.({
        city: "",
        state: selectedUF.sigla,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUF?.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ESTADO */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Estado
        </label>

        <input
          value={value?.state || ""}
          onChange={(e) =>
            onChange?.({
              city: "",
              state: e.target.value,
            })
          }
          list="uf-list"
          placeholder="Selecione o estado (UF)"
          className="w-full px-4 py-3 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        />

        <datalist id="uf-list">
          {ufs.map((uf) => (
            <option key={uf.id} value={uf.sigla}>
              {uf.nome}
            </option>
          ))}
        </datalist>
      </div>

      {/* CIDADE */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Cidade
        </label>

        <input
          value={value?.city || ""}
          onChange={(e) =>
            onChange?.({
              ...value,
              city: e.target.value,
            })
          }
          list="city-list"
          placeholder={selectedUF ? "Selecione a cidade" : "Escolha um estado"}
          disabled={!selectedUF || loadingCities}
          className="w-full px-4 py-3 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-100"
        />

        <datalist id="city-list">
          {cities.map((c) => (
            <option key={c.id} value={c.nome} />
          ))}
        </datalist>

        {loadingCities && (
          <p className="text-xs text-slate-500 mt-2">Carregando cidades...</p>
        )}
      </div>
    </div>
  );
}
