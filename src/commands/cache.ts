import { Command } from "commander";

import {
  cacheWarnMb,
  cleanPlans,
  dirSizeBytes,
  formatBytes,
  trimJournals,
} from "../cache.js";
import { cacheDir, loadConfig, plansDir } from "../config.js";
import { journalDir } from "../journal.js";
import { CliError, EXIT } from "../exit-codes.js";
import { addGlobalFlags } from "../global-flags.js";
import { emit, type GlobalFlags } from "../output.js";

// ===========================================================================
// `hs cache` — inspect and prune the local cache (~/.cache/hostedsuite): the
// two-phase plan store and the per-tenant change journal. Local-only — never
// targets a tenant, so it is exempt from strict require-tenant mode.
// ===========================================================================

export function buildCacheCommand(): Command {
  const root = new Command("cache").description(
    "Inspect/prune the local cache (bulk plans + change journal). Local-only; does not target a tenant.",
  );

  // --- info ------------------------------------------------------------------
  addGlobalFlags(root.command("info"))
    .description("Show cache location and sizes (plans, journal, total) as JSON.")
    .addHelpText("after", "\nExample:\n  hs cache info\n")
    .action((_opts, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags>();
      const plansBytes = dirSizeBytes(plansDir());
      const journalBytes = dirSizeBytes(journalDir());
      const totalBytes = dirSizeBytes(cacheDir());
      emit(
        {
          dir: cacheDir(),
          total: formatBytes(totalBytes),
          totalBytes,
          plans: { dir: plansDir(), bytes: plansBytes },
          journal: { dir: journalDir(), bytes: journalBytes },
          warnAtMb: cacheWarnMb(loadConfig()),
        },
        globals,
      );
    });

  // --- clean -----------------------------------------------------------------
  addGlobalFlags(root.command("clean"))
    .description(
      "Prune the cache: remove consumed/expired plan dirs; optionally trim old journal entries.",
    )
    .option("--journal-days <n>", "ALSO drop journal entries older than <n> days (forfeits `hs undo` for them)")
    .addHelpText(
      "after",
      "\nExamples:\n  hs cache clean                     # remove consumed + expired plan dirs (always safe)\n" +
        "  hs cache clean --journal-days 90   # additionally trim journal entries older than 90 days\n" +
        "  hs cache clean -n                  # dry-run: report what would be removed\n\n" +
        "Safety:\n  Plan pruning only removes dirs that can no longer be confirmed (consumed or expired).\n" +
        "  Journal trimming is opt-in via --journal-days because it forfeits `hs undo` for the dropped entries.\n",
    )
    .action((opts: { journalDays?: string }, command: Command) => {
      const globals = command.optsWithGlobals<GlobalFlags & { journalDays?: string }>();
      const dryRun = !!globals.dryRun;

      let journalDays: number | undefined;
      if (opts.journalDays !== undefined) {
        const n = Number(opts.journalDays);
        if (!Number.isFinite(n) || n < 0) {
          throw new CliError(EXIT.USAGE, `--journal-days must be a non-negative number (got "${opts.journalDays}").`);
        }
        journalDays = n;
      }

      const plans = cleanPlans(dryRun);
      const result: Record<string, unknown> = {
        dryRun: dryRun || undefined,
        plans: { removedDirs: plans.removedDirs, keptDirs: plans.keptDirs, freedBytes: plans.freedBytes },
      };
      let freed = plans.freedBytes;
      if (journalDays !== undefined) {
        const journal = trimJournals(journalDays, dryRun);
        result.journal = journal;
        freed += journal.freedBytes;
      }
      result.freed = formatBytes(freed);
      emit(result, globals);
    });

  return root;
}
