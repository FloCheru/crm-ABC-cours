import React, { useState } from "react";
import "./Table.css";

/* eslint-disable @typescript-eslint/no-explicit-any */

type StatusVariant = "active" | "inactive" | "pending";

interface TableColumn {
  /**
   * Clé unique de la colonne
   */
  key: string;

  /**
   * Libellé affiché dans l'en-tête
   */
  label: string;

  /**
   * Largeur de la colonne (optionnel)
   */
  width?: string;

  /**
   * Fonction de rendu personnalisé pour la cellule
   */
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableData {
  /**
   * ID unique de la ligne
   */
  id: string | number;

  /**
   * Données de la ligne (clé-valeur)
   */
  [key: string]: any;
}

interface TableProps {
  /**
   * Configuration des colonnes
   */
  columns: TableColumn[];

  /**
   * Données à afficher
   */
  data: TableData[];

  /**
   * Nombre d'éléments par page
   */
  itemsPerPage?: number;

  /**
   * Titre du tableau (optionnel)
   */
  title?: string;

  /**
   * Message affiché quand aucune donnée
   */
  emptyMessage?: string;

  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant Table avec pagination
 *
 * @example
 * ```tsx
 * // Utilisation avec Container (recommandé)
 * <Container>
 *   <h1>Liste des séries de coupons</h1>
 *   <Table columns={columns} data={data} />
 * </Container>
 *
 * // Utilisation simple
 * <Table
 *   title="Liste des coupons"
 *   columns={columns}
 *   data={data}
 * />
 * ```
 */
export const Table: React.FC<TableProps> = ({
  columns,
  data,
  itemsPerPage = 10,
  title,
  emptyMessage = "Aucune donnée disponible",
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculs pour la pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Génération des numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Composant pour les badges de statut
  const StatusBadge: React.FC<{ status: StatusVariant }> = ({ status }) => {
    const statusMap = {
      active: "Active",
      inactive: "Inactive",
      pending: "En attente",
    };

    return (
      <span className={`table__status table__status--${status}`}>
        {statusMap[status] || status}
      </span>
    );
  };

  // Rendu d'une cellule
  const renderCell = (column: TableColumn, row: TableData) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    // Rendu automatique pour les statuts
    if (column.key === "status" || column.key === "statut") {
      return <StatusBadge status={value} />;
    }

    return value;
  };

  const wrapperClasses = ["table-wrapper", className].filter(Boolean).join(" ");

  if (data.length === 0) {
    return (
      <div className={wrapperClasses}>
        {title && <h2 className="table__title">{title}</h2>}
        <div className="table__empty">
          <div className="table__empty-title">Aucune donnée</div>
          <div className="table__empty-description">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {title && <h2 className="table__title">{title}</h2>}

      <table className="table">
        <thead className="table__header">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="table__header-cell"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {currentData.map((row) => (
            <tr key={row.id} className="table__row">
              {columns.map((column) => (
                <td key={column.key} className="table__cell">
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="table__pagination">
          <span className="pagination__info">
            Page {currentPage} sur {totalPages}
          </span>

          <button
            className="pagination__button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            ‹
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`pagination__button ${
                currentPage === page ? "pagination__button--active" : ""
              }`}
              onClick={() => setCurrentPage(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination__button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
