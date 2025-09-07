import React from "react";
import "./Container.css";

type ContainerLayout =
  | "grid"
  | "two-columns"
  | "three-columns"
  | "flex"
  | "flex-col";
type ContainerSize = "sm" | "md" | "lg" | "full";
type ContainerPadding = "none" | "sm" | "md" | "lg";
type ContainerAlign = "start" | "center" | "end";
type ContainerJustify = "start" | "center" | "end" | "between";

interface ContainerProps {
  /**
   * Type de layout
   */
  layout?: ContainerLayout;

  /**
   * Type de justification
   */
  justify?: ContainerJustify;

  /**
   * Taille maximale du container
   */
  size?: ContainerSize;

  /**
   * Padding horizontal
   */
  padding?: ContainerPadding;

  /**
   * Alignement des éléments (pour flex layouts)
   */
  align?: ContainerAlign;

  /**
   * Contenu du container
   */
  children: React.ReactNode;

  /**
   * Element HTML à utiliser
   */
  as?: React.ElementType;
}

/**
 * Composant Container pour gérer les layouts et l'espacement
 *
 * @example
 * ```tsx
 * // Container basique
 * <Container>
 *   <p>Contenu centré avec padding</p>
 * </Container>
 *
 * // Layout grid pour dashboard
 * <Container layout="grid">
 *   <SummaryCard {...} />
 *   <SummaryCard {...} />
 * </Container>
 *
 * // Layout flex avec alignement start
 * <Container layout="flex" align="start">
 *   <div>Sidebar</div>
 *   <div>Content</div>
 * </Container>
 * ```
 */
export const Container: React.FC<ContainerProps> = ({
  layout = "flex",
  justify = "between",
  size = "md",
  padding = "md",
  align = "center",
  children,
  as: Element = "div",
}) => {
  const classes = [
    "container",
    `container--${layout}`,
    size !== "md" && `container--${size}`,
    padding === "none" && "container--no-padding",
    padding === "sm" && "container--sm-padding",
    padding === "lg" && "container--lg-padding",
    justify !== "between" && `container--justify-${justify}`,
    align !== "center" && `container--items-${align}`,
  ]
    .filter(Boolean)
    .join(" ");

  return React.createElement(Element, { className: classes }, children);
};
