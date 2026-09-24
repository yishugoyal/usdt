import { IRateProvider, RateResponse } from '../interfaces/IRateProvider';
import { Decimal } from '@/lib/decimal';

export class MockRateProvider implements IRateProvider {
  name = 'MOCK_SANDBOX_RATE_PROVIDER';

  async fetchLiveRate(assetSymbol: string, currency: string): Promise<RateResponse> {
    // Base benchmark rate USDT -> INR around 89.45
    // Add small random fluctuation to simulate real market volatility
    const baseRate = 89.45;
    const fluctuation = (Math.random() - 0.5) * 0.30;
    const rate = new Decimal(baseRate + fluctuation).round();

    return {
      assetSymbol,
      currency,
      rate: rate.toDecimalPlaces(4),
      timestamp: new Date(),
      source: 'RupeeBridge Institutional Exchange Index',
    };
  }
}
