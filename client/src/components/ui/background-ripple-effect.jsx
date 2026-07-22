"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundRippleEffect = ({
  rows = 8,
  cols = 27,
  // Bumping this value programmatically (e.g. when a player joins or is
  // kicked) triggers a ripple, in addition to the existing click-to-ripple
  // interaction. The ripple originates from rippleOrigin ({row, col}) when
  // provided, falling back to the grid's center.
  rippleTrigger = 0,
  rippleOrigin = null
}) => {
  const [clickedCell, setClickedCell] = useState(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef(null);
  const isFirstRippleTrigger = useRef(true);

  useEffect(() => {
    if (isFirstRippleTrigger.current) {
      isFirstRippleTrigger.current = false;
      return;
    }
    setClickedCell(rippleOrigin ?? { row: Math.floor(rows / 2), col: Math.floor(cols / 2) });
    setRippleKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rippleTrigger]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden",
        "[--cell-border-color:rgba(26,46,26,0.28)] [--cell-fill-color:rgba(26,46,26,0.10)] [--cell-shadow-color:rgba(45,106,45,0.35)]",
        "dark:[--cell-border-color:rgba(200,220,200,0.2)] dark:[--cell-fill-color:rgba(26,46,26,0.24)] dark:[--cell-shadow-color:rgba(200,220,200,0.3)]"
      )}>
      <div className="relative h-full w-full">
        <div
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-hidden" />
        <DivGrid
          key={`base-${rippleKey}`}
          className="opacity-50"
          rows={rows}
          cols={cols}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          onCellClick={(row, col) => {
            setClickedCell({ row, col });
            setRippleKey((k) => k + 1);
          }}
          interactive />
      </div>
    </div>
  );
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  borderColor = "#3f3f46",
  fillColor = "rgba(14,165,233,0.3)",
  clickedCell = null,
  onCellClick = () => {},
  interactive = true
}) => {
  const cells = useMemo(() => Array.from({ length: rows * cols }, (_, idx) => idx), [rows, cols]);

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    width: "100%",
    height: "100%",
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-[3]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
        const duration = 200 + distance * 80; // ms

        const style = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-60 transition-opacity duration-150 will-change-transform hover:opacity-90 dark:shadow-[0px_0px_40px_1px_var(--cell-shadow-color)_inset]",
              clickedCell && "animate-cell-ripple",
              !interactive && "pointer-events-none"
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            } />
        );
      })}
    </div>
  );
};
