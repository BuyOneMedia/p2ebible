-- P2E Bible — Initial Database Schema
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS games (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    UNIQUE NOT NULL,
  name          TEXT    NOT NULL,
  description   TEXT,
  website_url   TEXT,
  chain         TEXT,
  genre         TEXT,
  token_symbol  TEXT,
  image_url     TEXT,
  status        TEXT    NOT NULL DEFAULT 'pending_review',
  source        TEXT    NOT NULL DEFAULT 'web_search',
  source_url    TEXT,
  referral_url  TEXT,
  affiliate_notes TEXT,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id               INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  risk_level            TEXT    NOT NULL,
  score                 INTEGER NOT NULL,
  tokenomics_analysis   TEXT,
  team_analysis         TEXT,
  whitepaper_analysis   TEXT,
  red_flags             TEXT,
  green_flags           TEXT,
  full_analysis         TEXT,
  analyzed_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    UNIQUE,
  partner          TEXT    NOT NULL,
  partner_category TEXT    NOT NULL,
  display_name     TEXT    NOT NULL,
  destination_url  TEXT    NOT NULL,
  affiliate_url    TEXT    NOT NULL,
  notes            TEXT,
  game_id          INTEGER REFERENCES games(id) ON DELETE SET NULL,
  click_count      INTEGER NOT NULL DEFAULT 0,
  last_clicked_at  DATETIME,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clicks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_link_id INTEGER NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  ip_hash           TEXT,
  user_agent        TEXT,
  referrer          TEXT,
  clicked_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  agent           TEXT    NOT NULL,
  status          TEXT    NOT NULL,
  games_found     INTEGER NOT NULL DEFAULT 0,
  games_analyzed  INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME
);

-- ============================================================
-- SEED: All affiliate links from the P2E Bible Appendix
-- UPDATE affiliate_url values with YOUR IDs in the admin panel
-- ============================================================

INSERT OR IGNORE INTO affiliate_links (slug,partner,partner_category,display_name,destination_url,affiliate_url,notes) VALUES
('ledger','ledger','wallet','Ledger Hardware Wallet','https://ledger.com','https://shop.ledger.com/?r=YOUR_ID','affiliate.ledger.com'),
('trezor','trezor','wallet','Trezor Hardware Wallet','https://trezor.io','https://trezor.io/?aff_id=YOUR_ID','trezor.io/affiliate'),
('metamask','metamask','wallet','MetaMask','https://metamask.io','https://metamask.io','No affiliate program'),
('phantom','phantom','wallet','Phantom Wallet','https://phantom.app','https://phantom.app','No affiliate program'),
('rainbow','rainbow','wallet','Rainbow Wallet','https://rainbow.me','https://rainbow.me','No affiliate program'),
('coinbase-wallet','coinbase','wallet','Coinbase Wallet','https://wallet.coinbase.com','https://wallet.coinbase.com','No affiliate program'),
('coinbase','coinbase','exchange','Coinbase','https://coinbase.com','https://coinbase.com/join/YOUR_ID','coinbase.com/earn'),
('kraken','kraken','exchange','Kraken','https://kraken.com','https://kraken.com/sign-up?referral=YOUR_ID','kraken.com/referrals'),
('binance','binance','exchange','Binance','https://binance.com','https://www.binance.com/en/activity/referral-entry?ref=YOUR_ID','binance.com/en/referral'),
('gemini','gemini','exchange','Gemini','https://gemini.com','https://gemini.com/share/YOUR_ID','gemini.com/referral'),
('uniswap','uniswap','dex','Uniswap','https://app.uniswap.org','https://app.uniswap.org','No affiliate program'),
('sushiswap','sushiswap','dex','SushiSwap','https://www.sushi.com','https://www.sushi.com','No affiliate program'),
('jupiter','jupiter','dex','Jupiter (Solana)','https://jup.ag','https://jup.ag','No affiliate program'),
('opensea','opensea','nft','OpenSea','https://opensea.io','https://opensea.io','No affiliate program'),
('blur','blur','nft','Blur','https://blur.io','https://blur.io','No affiliate program'),
('magic-eden','magic-eden','nft','Magic Eden','https://magiceden.io','https://magiceden.io','No affiliate program'),
('tensor','tensor','nft','Tensor','https://tensor.trade','https://tensor.trade','No affiliate program'),
('dune','dune','analytics','Dune Analytics','https://dune.com','https://dune.com','dune.com/affiliates'),
('nansen','nansen','analytics','Nansen','https://nansen.ai','https://nansen.ai/?ref=YOUR_ID','nansen.ai'),
('etherscan','etherscan','analytics','Etherscan','https://etherscan.io','https://etherscan.io','No affiliate program'),
('polygonscan','polygon','analytics','PolygonScan','https://polygonscan.com','https://polygonscan.com','No affiliate program'),
('solscan','solscan','analytics','Solscan','https://solscan.io','https://solscan.io','No affiliate program'),
('coingecko','coingecko','analytics','CoinGecko','https://coingecko.com','https://coingecko.com','No affiliate program'),
('coinmarketcap','coinmarketcap','analytics','CoinMarketCap','https://coinmarketcap.com','https://coinmarketcap.com','No affiliate program'),
('cryptoslam','cryptoslam','analytics','CryptoSlam','https://cryptoslam.io','https://cryptoslam.io','No affiliate program'),
('dappradar','dappradar','research','DappRadar','https://dappradar.com','https://dappradar.com','dappradar.com partners'),
('coingecko-gaming','coingecko','research','CoinGecko Gaming','https://coingecko.com/en/categories/gaming','https://coingecko.com/en/categories/gaming','No affiliate program'),
('koinly','koinly','tax','Koinly','https://koinly.io','https://koinly.io/?via=YOUR_ID','koinly.io/affiliates'),
('coinledger','coinledger','tax','CoinLedger','https://coinledger.io','https://coinledger.io/?via=YOUR_ID','coinledger.io/affiliates'),
('tokentax','tokentax','tax','TokenTax','https://tokentax.co','https://tokentax.co/?ref=YOUR_ID','tokentax.co/affiliates'),
('zenledger','zenledger','tax','ZenLedger','https://zenledger.io','https://zenledger.io/?ref=YOUR_ID','zenledger.io'),
('revoke','revoke','security','Revoke.cash','https://revoke.cash','https://revoke.cash','Free tool — no affiliate'),
('wallet-guard','wallet-guard','security','Wallet Guard','https://walletguard.app','https://walletguard.app','Check for affiliate program'),
('pocket-universe','pocket-universe','security','Pocket Universe','https://pocketuniverse.app','https://pocketuniverse.app','Check for affiliate program'),
('coursera','coursera','learning','Coursera','https://coursera.org','https://coursera.org/?utm_source=p2ebible','coursera.org affiliates'),
('udemy','udemy','learning','Udemy','https://udemy.com','https://udemy.com/?aff_code=YOUR_CODE','udemy.com/affiliate'),
('buildspace','buildspace','learning','Buildspace','https://buildspace.so','https://buildspace.so','No affiliate program'),
('mirror','mirror','learning','Mirror','https://mirror.xyz','https://mirror.xyz','No affiliate program'),
('discord','discord','community','Discord','https://discord.com','https://discord.com','No affiliate program'),
('twitter','twitter','community','Twitter/X','https://twitter.com','https://twitter.com','No affiliate program'),
('linkedin','linkedin','community','LinkedIn','https://linkedin.com','https://linkedin.com','No affiliate program'),
('gitcoin','gitcoin','community','Gitcoin','https://gitcoin.co','https://gitcoin.co','Check for partner program'),
('web3career','web3career','career','Web3.career','https://web3.career','https://web3.career','Check for affiliate program'),
('cryptojobslist','cryptojobs','career','CryptoJobsList','https://cryptojobslist.com','https://cryptojobslist.com','Check for affiliate program'),
('wellfound','wellfound','career','Wellfound','https://wellfound.com','https://wellfound.com','No affiliate program'),
('book','amazon','product','The P2E Bible — Get the Book','https://amazon.com','https://www.amazon.com/dp/YOUR_ASIN?tag=YOUR_AMAZON_TAG','Update with your ASIN + Amazon Associates tag');
