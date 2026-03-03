/**
 * Clerk helper — builds the /go/[id] redirect URL for all outbound links.
 * This ensures every click goes through the Clerk route handler
 * so we can inject affiliate IDs and track clicks.
 */

export function clerkUrl(affiliateLinkId: number): string {
  const base = process.env.AFFILIATE_BASE_URL || 'https://p2ebible.com/go';
  return `${base}/${affiliateLinkId}`;
}

/**
 * Injects affiliate IDs into a partner URL based on available env vars.
 * Used when the Clerk route builds the final redirect target.
 */
export function buildAffiliateUrl(partner: string, baseUrl: string): string {
  switch (partner.toLowerCase()) {
    case 'ledger': {
      const id = process.env.LEDGER_AFFILIATE_ID;
      if (!id) return baseUrl;
      return `https://shop.ledger.com/?r=${id}`;
    }
    case 'binance': {
      const id = process.env.BINANCE_REFERRAL_ID;
      if (!id) return baseUrl;
      return `https://www.binance.com/en/activity/referral-entry?fromActivityPage=true&ref=${id}`;
    }
    case 'coinbase': {
      const id = process.env.COINBASE_REFERRAL_ID;
      if (!id) return baseUrl;
      return `https://coinbase.com/join/${id}`;
    }
    case 'amazon': {
      const tag = process.env.AMAZON_ASSOCIATE_ID;
      if (!tag) return baseUrl;
      // Append/replace tag parameter
      const url = new URL(baseUrl);
      url.searchParams.set('tag', tag);
      return url.toString();
    }
    default:
      return baseUrl;
  }
}
