/* Copyright (c) 2026 eele14. All Rights Reserved. */
import os from "os";

export interface ServerMetrics {
  cpu: number;
  ramUsed: number;
  ramTotal: number;
  uptime: number;
  nodeUptime: number;
  heapUsed: number;
  heapTotal: number;
  cpuModel: string;
  cpuCores: number;
}

function sampleCpuTimes() {
  return os.cpus().map((c) => ({
    idle: c.times.idle,
    total: (Object.values(c.times) as number[]).reduce((a, b) => a + b, 0),
  }));
}

function cpuPercent(): Promise<number> {
  return new Promise((resolve) => {
    const before = sampleCpuTimes();
    setTimeout(() => {
      const after = sampleCpuTimes();
      let idleDelta = 0;
      let totalDelta = 0;
      for (let i = 0; i < after.length; i++) {
        idleDelta += after[i].idle - before[i].idle;
        totalDelta += after[i].total - before[i].total;
      }
      resolve(
        totalDelta === 0 ? 0 : Math.round((1 - idleDelta / totalDelta) * 100),
      );
    }, 150);
  });
}

export async function getMetrics(): Promise<ServerMetrics> {
  const cpu = await cpuPercent();
  const mem = process.memoryUsage();
  const cpus = os.cpus();
  return {
    cpu,
    ramUsed: os.totalmem() - os.freemem(),
    ramTotal: os.totalmem(),
    uptime: Math.round(os.uptime()),
    nodeUptime: Math.round(process.uptime()),
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    cpuModel: cpus[0]?.model.trim() ?? "Unknown",
    cpuCores: cpus.length,
  };
}
