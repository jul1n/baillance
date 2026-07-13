import React from "react";

/**
 * Une occurrence du mot « Carnet » : cliquable, soulignée d'un
 * pointillé fin, elle ouvre l'intercalaire de correspondance.
 */
export default function CarnetWord({ children = "Carnet", onOpen, className = "" }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`carnet-word ic-focus ${className}`}
      title="Recevoir les Carnets par correspondance"
    >
      {children}
    </button>
  );
}
