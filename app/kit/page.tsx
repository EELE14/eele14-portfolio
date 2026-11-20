/* Copyright (c) 2026 eele14. All Rights Reserved. */
import type { Metadata } from "next";
import Button, { type ButtonVariant } from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import {
  IconBack,
  IconForward,
  IconRefresh,
} from "@/components/icons/NavIcons";
import styles from "./kit.module.css";

export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false },
};

const VARIANTS: ButtonVariant[] = [
  "default",
  "primary",
  "destructive",
  "plain",
];

const COLORS = [
  "accent",
  "red",
  "orange",
  "yellow",
  "green",
  "label",
  "label-secondary",
  "separator",
  "window-bg",
  "content-bg",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function KitPage() {
  return (
    <main className={styles.page}>
      <h1>UI kit</h1>

      <Section title="Type">
        <div className={styles.type}>
          <span
            style={{ fontSize: "var(--ui-text-large-title)", fontWeight: 700 }}
          >
            Large title 22
          </span>
          <span style={{ fontSize: "var(--ui-text-title)", fontWeight: 600 }}>
            Title 15
          </span>
          <span>Body 13, the default for labels and controls</span>
          <span style={{ color: "var(--ui-label-secondary)" }}>
            Secondary label
          </span>
          <span style={{ fontSize: "var(--ui-text-small)" }}>Small 11</span>
          <span style={{ fontFamily: "var(--ui-font-mono)" }}>
            Monospace for code and the terminal
          </span>
        </div>
      </Section>

      <Section title="Colours">
        <div className={styles.swatches}>
          {COLORS.map((name) => (
            <div key={name} className={styles.swatch}>
              <span style={{ background: `var(--ui-${name})` }} />
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className={styles.grid}>
          {VARIANTS.map((variant) => (
            <div key={variant} style={{ display: "contents" }}>
              <span className={styles.rowLabel}>{variant}</span>
              <Button variant={variant}>Regular</Button>
              <Button variant={variant} size="small">
                Small
              </Button>
              <Button variant={variant} icon={<IconRefresh />}>
                With icon
              </Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Icon buttons">
        <div className={styles.grid}>
          <span className={styles.rowLabel}>regular</span>
          <IconButton label="Back" icon={<IconBack />} />
          <IconButton label="Forward" icon={<IconForward />} />
          <IconButton label="Reload" icon={<IconRefresh />} aria-pressed />
          <IconButton label="Back" icon={<IconBack />} disabled />
          <span className={styles.rowLabel}>small</span>
          <IconButton label="Back" icon={<IconBack />} size="small" />
          <IconButton label="Forward" icon={<IconForward />} size="small" />
          <IconButton
            label="Reload"
            icon={<IconRefresh />}
            size="small"
            aria-pressed
          />
          <IconButton label="Back" icon={<IconBack />} size="small" disabled />
        </div>
      </Section>
    </main>
  );
}
