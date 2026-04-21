import { AnomalyDetectionService } from './anomalyDetection';
import { ReputationService } from './reputationService';

type PeriodicJob = {
  name: string;
  intervalMs: number;
  runOnStart: boolean;
  enabled: boolean;
  task: () => Promise<void>;
};

type JobState = {
  timer: NodeJS.Timeout;
  running: boolean;
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function parseInterval(value: string | undefined, fallbackMs: number, minMs: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallbackMs;
  }
  return Math.max(minMs, Math.floor(parsed));
}

export type BackgroundJobRunnerOptions = {
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
};

export class BackgroundJobRunner {
  private readonly logger: Pick<Console, 'log' | 'warn' | 'error'>;
  private readonly jobs = new Map<string, JobState>();

  constructor(options: BackgroundJobRunnerOptions = {}) {
    this.logger = options.logger ?? console;
  }

  private scheduleJob(config: PeriodicJob): void {
    if (!config.enabled) {
      this.logger.log(`[jobs] ${config.name} disabled`);
      return;
    }

    const state: JobState = {
      timer: setInterval(() => {
        void runTask();
      }, config.intervalMs),
      running: false,
    };

    const runTask = async () => {
      if (state.running) {
        this.logger.warn(`[jobs] ${config.name} skipped (previous run still in progress)`);
        return;
      }

      state.running = true;
      const startedAt = Date.now();

      try {
        await config.task();
        this.logger.log(`[jobs] ${config.name} completed in ${Date.now() - startedAt}ms`);
      } catch (error) {
        this.logger.error(`[jobs] ${config.name} failed`, error);
      } finally {
        state.running = false;
      }
    };

    this.jobs.set(config.name, state);
    this.logger.log(`[jobs] ${config.name} scheduled every ${config.intervalMs}ms`);

    if (config.runOnStart) {
      void runTask();
    }
  }

  start(): void {
    if (this.jobs.size > 0) {
      return;
    }

    const reputationService = new ReputationService();
    const anomalyDetectionService = new AnomalyDetectionService();

    this.scheduleJob({
      name: 'reputation-refresh',
      enabled: parseBoolean(process.env.REPUTATION_JOB_ENABLED, true),
      intervalMs: parseInterval(process.env.REPUTATION_JOB_INTERVAL_MS, 10 * 60 * 1000, 15_000),
      runOnStart: parseBoolean(process.env.REPUTATION_JOB_RUN_ON_START, true),
      task: async () => {
        const result = await reputationService.recomputeReputation();
        this.logger.log(`[jobs] reputation-refresh updated ${result.updatedCount} users`);
      },
    });

    this.scheduleJob({
      name: 'anomaly-detection',
      enabled: parseBoolean(process.env.ANOMALY_JOB_ENABLED, true),
      intervalMs: parseInterval(process.env.ANOMALY_JOB_INTERVAL_MS, 7 * 60 * 1000, 15_000),
      runOnStart: parseBoolean(process.env.ANOMALY_JOB_RUN_ON_START, true),
      task: async () => {
        const result = await anomalyDetectionService.runDetection({ trigger: 'periodic' });
        this.logger.log(
          `[jobs] anomaly-detection clusters=${result.clusters.length} flags=${result.flagsCreated}`
        );
      },
    });
  }

  stop(): void {
    for (const [name, state] of this.jobs.entries()) {
      clearInterval(state.timer);
      this.logger.log(`[jobs] ${name} stopped`);
    }
    this.jobs.clear();
  }
}
