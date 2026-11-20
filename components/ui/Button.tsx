/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";
import { classNames } from "./classNames";

export type ButtonVariant = "default" | "primary" | "destructive" | "plain";
export type ControlSize = "small" | "regular";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  icon?: ReactNode;
}

export default function Button({
  variant = "default",
  size = "regular",
  icon,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        styles.button,
        styles[variant],
        styles[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
