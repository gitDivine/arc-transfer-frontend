export interface LifiQuoteParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  allowBridges?: string[];
}

export class LifiService {
  private baseUrl = 'https://li.quest/v1';

  async getQuote(params: LifiQuoteParams) {
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.append('fromChain', params.fromChain.toString());
    url.searchParams.append('toChain', params.toChain.toString());
    url.searchParams.append('fromToken', params.fromToken);
    url.searchParams.append('toToken', params.toToken);
    url.searchParams.append('fromAmount', params.fromAmount);
    url.searchParams.append('fromAddress', params.fromAddress);
    if (params.allowBridges) {
      url.searchParams.append('allowBridges', params.allowBridges.join(','));
    }

    console.log(`[LI.FI] Fetching quote: ${url.toString()}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LI.FI] Error response:`, errorText);
      throw new Error(`LI.FI API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}

export const lifiService = new LifiService();
