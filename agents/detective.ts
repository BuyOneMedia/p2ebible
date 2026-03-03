/**
 * DETECTIVE AGENT — AI Scam Radar
 * Runs every 6 hours (offset 30 min from Scout).
 * Analyzes each new game found by Scout and assigns a Risk Score.
 *
 * Risk Levels:
 *  safe       (0–25)   — Established project, doxxed team, solid tokenomics
 *  moderate   (26–50)  — Some unknowns, but not alarming
 *  high_risk  (51–75)  — Multiple red flags, proceed with caution
 *  scam       (76–100) — Clear rug-pull signals or confirmed fraud
 */

import Anthropic from '@anthropic-ai/sdk';
import cron from 'node-cron';
import {
  getDb,
  getPendingGames,
  saveRiskScore,
  logAgentRun,
  Game,
  DetectiveResult,
  RiskLevel
} from './shared/db';

// ── Logging ────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[Detective ${new Date().toISOString()}] ${msg}`);
}

// ── Claude Analysis Prompt ─────────────────────────────────────────────────

const ANALYSIS_PROMPT = (game: Game) => `
You are the Detective — an expert Web3 security analyst and P2E game auditor.
Analyze this Play-to-Earn game and assign a Risk Score.

GAME DETAILS:
- Name: ${game.name}
- Chain: ${game.chain || 'Unknown'}
- Genre: ${game.genre || 'Unknown'}
- Token: ${game.token_symbol || 'Unknown'}
- Website: ${game.website_url || 'Unknown'}
- Description: ${game.description || 'No description available'}
- Source: ${game.source} (${game.source_url || 'N/A'})

ANALYSIS CRITERIA:
1. Tokenomics: Is the token supply reasonable? Any hidden minting? Locked liquidity?
2. Team: Are the developers doxxed? Any history of rugpulls? Anonymous team?
3. Whitepaper/Documentation: Does it exist? Is it substantive or copy-paste?
4. Social Proof: Community size, official social channels, verified accounts?
5. Smart Contract: Audited? Any known vulnerabilities?
6. Business Model: Is the P2E economy sustainable, or does it require constant new players?

Return a JSON object with EXACTLY this structure (no other text):
{
  "risk_level": "safe" | "moderate" | "high_risk" | "scam",
  "score": <integer 0-100, where 0=safest and 100=definite scam>,
  "tokenomics_analysis": "<2-3 sentence analysis of token economics>",
  "team_analysis": "<2-3 sentence analysis of team credibility>",
  "whitepaper_analysis": "<2-3 sentence analysis of documentation quality>",
  "red_flags": ["<red flag 1>", "<red flag 2>", ...],
  "green_flags": ["<green flag 1>", "<green flag 2>", ...],
  "full_analysis": "<comprehensive 3-5 paragraph analysis covering all criteria above>"
}

Risk score guidelines:
- 0-25: safe — Verified team, audited contracts, sustainable tokenomics
- 26-50: moderate — Some unknowns, but no clear red flags
- 51-75: high_risk — Multiple concerns, unverified claims, unsustainable model
- 76-100: scam — Anonymous devs, fake promises, rug-pull indicators
`;

// ── Detective Core ─────────────────────────────────────────────────────────

async function analyzeGame(game: Game, client: Anthropic): Promise<DetectiveResult | null> {
  log(`Analyzing: ${game.name} (id: ${game.id})`);

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: ANALYSIS_PROMPT(game)
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      log(`No text response for: ${game.name}`);
      return null;
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log(`Could not parse JSON for: ${game.name}`);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as {
      risk_level: string;
      score: number;
      tokenomics_analysis: string;
      team_analysis: string;
      whitepaper_analysis: string;
      red_flags: string[];
      green_flags: string[];
      full_analysis: string;
    };

    // Validate risk_level
    const validLevels: RiskLevel[] = ['safe', 'moderate', 'high_risk', 'scam'];
    if (!validLevels.includes(result.risk_level as RiskLevel)) {
      log(`Invalid risk_level "${result.risk_level}" for: ${game.name}`);
      return null;
    }

    // Validate score
    const score = Math.max(0, Math.min(100, Math.round(result.score)));

    return {
      risk_level: result.risk_level as RiskLevel,
      score,
      tokenomics_analysis: result.tokenomics_analysis || '',
      team_analysis: result.team_analysis || '',
      whitepaper_analysis: result.whitepaper_analysis || '',
      red_flags: Array.isArray(result.red_flags) ? result.red_flags : [],
      green_flags: Array.isArray(result.green_flags) ? result.green_flags : [],
      full_analysis: result.full_analysis || '',
    };

  } catch (err) {
    log(`Analysis error for ${game.name}: ${err}`);
    return null;
  }
}

// ── Main Run ───────────────────────────────────────────────────────────────

async function runDetective() {
  log('=== Detective starting ===');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('ANTHROPIC_API_KEY not set — Detective cannot run');
    return;
  }

  const runId = logAgentRun('detective', 'running');
  const client = new Anthropic({ apiKey });

  try {
    const pendingGames = getPendingGames();
    log(`Found ${pendingGames.length} games to analyze`);

    if (pendingGames.length === 0) {
      logAgentRun('detective', 'completed', 0, 0, undefined, runId);
      log('=== Detective done (no pending games) ===');
      return;
    }

    let analyzed = 0;

    for (const game of pendingGames) {
      const result = await analyzeGame(game, client);

      if (result) {
        saveRiskScore(game.id, result);
        analyzed++;
        log(`✓ ${game.name} → ${result.risk_level} (score: ${result.score})`);
      } else {
        // Mark as needing retry — set a default moderate risk so it doesn't block forever
        const db = getDb();
        db.prepare(`UPDATE games SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(game.id);
        log(`⚠ ${game.name} — could not analyze, approved with no score`);
      }

      // Pace requests: 1 second between each to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    logAgentRun('detective', 'completed', 0, analyzed, undefined, runId);
    log(`=== Detective done — analyzed ${analyzed}/${pendingGames.length} ===`);

  } catch (err) {
    log(`FATAL ERROR: ${err}`);
    logAgentRun('detective', 'failed', 0, 0, String(err), runId);
  }
}

// ── Schedule ───────────────────────────────────────────────────────────────

log('Detective agent starting — will run every 6 hours (offset 30 min)');
runDetective(); // Run immediately on start

// Offset 30 min from Scout: runs at 0:30, 6:30, 12:30, 18:30
cron.schedule('30 0,6,12,18 * * *', () => {
  runDetective();
});
