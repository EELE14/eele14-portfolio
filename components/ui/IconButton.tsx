/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ControlSize } from "./Button";
import styles from "./Button.module.css";
import { classNames } from "./classNames";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  label: string;
  icon: ReactNode;
  size?: ControlSize;
}

export default function IconButton({
  label,
  icon,
  size = "regular",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={classNames(
        styles.button,
        styles.icon,
        styles[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
