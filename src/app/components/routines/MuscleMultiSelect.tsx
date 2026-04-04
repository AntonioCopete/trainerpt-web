"use client";

import { useId, useMemo } from "react";
import Select, { type StylesConfig } from "react-select";
import type { MuscleCatalogItem } from "@/src/app/lib/types/routines";

const muscleMultiSelectStyles: StylesConfig<MuscleCatalogItem, true> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgb(17 24 39)",
    borderColor: state.isFocused ? "rgba(249 115 22 / 0.55)" : "rgb(55 65 81)",
    borderRadius: "0.375rem",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(249 115 22 / 0.22)" : "none",
    minHeight: 42,
    "&:hover": { borderColor: "rgb(75 85 99)" },
  }),
  /** Stay in DOM under Dialog (no portal): Radix modal blocks pointer events outside Content. */
  menu: (base) => ({
    ...base,
    backgroundColor: "rgb(17 24 39)",
    border: "1px solid rgb(55 65 81)",
    borderRadius: "0.375rem",
    overflow: "hidden",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.35), 0 4px 6px -4px rgb(0 0 0 / 0.35)",
    zIndex: 50,
    pointerEvents: "auto",
  }),
  menuList: (base) => ({ ...base, maxHeight: 220, padding: 4 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "rgb(31 41 55)"
      : state.isSelected
        ? "rgba(234 88 12 / 0.2)"
        : "transparent",
    color: "rgb(243 244 246)",
    cursor: "pointer",
    borderRadius: "0.25rem",
    ":active": { backgroundColor: "rgb(55 65 81)" },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "rgba(234 88 12 / 0.22)",
    borderRadius: 6,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "rgb(254 215 170)",
    fontSize: "0.8125rem",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "rgb(251 146 60)",
    borderRadius: 4,
    ":hover": {
      backgroundColor: "rgba(234 88 12 / 0.45)",
      color: "rgb(255 255 255)",
    },
  }),
  input: (base) => ({ ...base, color: "rgb(243 244 246)" }),
  placeholder: (base) => ({ ...base, color: "rgb(107 114 128)" }),
  singleValue: (base) => ({ ...base, color: "rgb(243 244 246)" }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "rgb(75 85 99)" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: "rgb(156 163 175)",
    ":hover": { color: "rgb(209 213 219)" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "rgb(156 163 175)",
    ":hover": { color: "rgb(251 146 60)" },
  }),
};

export interface MuscleMultiSelectProps {
  options: MuscleCatalogItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  inputId?: string;
  placeholder?: string;
}

export function MuscleMultiSelect({
  options,
  value,
  onChange,
  disabled,
  inputId,
  placeholder = "Buscar o elegir músculos secundarios…",
}: MuscleMultiSelectProps) {
  const reactId = useId();
  const instanceId = `muscle-ms-${reactId.replace(/:/g, "")}`;

  const selected = useMemo(
    () =>
      value
        .map((id) => options.find((m) => m.id === id))
        .filter(Boolean) as MuscleCatalogItem[],
    [value, options],
  );

  return (
    <Select<MuscleCatalogItem, true>
      instanceId={instanceId}
      inputId={inputId}
      isMulti
      options={options}
      value={selected}
      onChange={(next) => onChange(next?.length ? next.map((m) => m.id) : [])}
      getOptionValue={(m) => m.id}
      getOptionLabel={(m) => m.nameEs}
      filterOption={(candidate, input) => {
        if (!input) return true;
        const q = input.trim().toLowerCase();
        const m = candidate.data;
        return (
          m.nameEs.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
        );
      }}
      placeholder={placeholder}
      noOptionsMessage={() => "Sin coincidencias"}
      loadingMessage={() => "Cargando…"}
      isClearable
      closeMenuOnSelect={false}
      hideSelectedOptions
      blurInputOnSelect={false}
      isDisabled={disabled}
      menuPosition="absolute"
      menuShouldScrollIntoView={false}
      styles={muscleMultiSelectStyles}
      className="text-sm"
      classNamePrefix="muscle-ms"
    />
  );
}
