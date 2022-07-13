import mockAxios from 'jest-mock-axios';

import { ETHUUID } from '@config';
import { fAccount, fAssets, fNetwork, fNetworks, fRopDAI, fSwapQuote } from '@fixtures';
import { fetchUniversalGasPriceEstimate } from '@services/ApiService/Gas';
import {
  ITxData,
  ITxGasPrice,
  ITxToAddress,
  ITxType,
  ITxValue,
  TTicker,
  TUuid,
  WalletId
} from '@types';
import { bigify } from '@utils';

import { DexService } from '.';
import { formatTradeTx } from './Dex';

jest.mock('@services/ApiService/Gas', () => ({
  ...jest.requireActual('@services/ApiService/Gas'),
  fetchUniversalGasPriceEstimate: jest.fn().mockResolvedValue({ estimate: { gasPrice: '154' } })
}));

describe('SwapFlow', () => {
  afterEach(() => {
    mockAxios.reset();
  });
  describe('getOrderDetails', () => {
    it('returns the expected two transactions for a multi tx swap', async () => {
      const promise = DexService.instance.getOrderDetailsFrom(
        { ...fNetwork, supportsEIP1559: false },
        fAccount,
        fRopDAI,
        fAssets[0],
        '1'
      );
      mockAxios.mockResponse({
        data: { ...fSwapQuote }
      });
      const result = await promise;
      expect(result.approvalTx).toStrictEqual({
        chainId: fNetwork.chainId,
        data:
          '0x095ea7b3000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        from: fAccount.address,
        gasPrice: '0x23db1d8400',
        to: '0x6b175474e89094c44da98b954eedeac495271d0f',
        txType: 'APPROVAL',
        value: '0x0'
      });
      expect(result.tradeTx).toStrictEqual({
        chainId: fNetwork.chainId,
        data:
          '0xd9627aa400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000002429108b8f331000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000096596a1ef6601a8b3a',
        gasPrice: '0x23db1d8400',
        to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        txType: 'SWAP',
        value: '0x0',
        metadata: { receivingAsset: ETHUUID }
      });
    });

    it('returns the expected two transactions for a multi tx swap using eip1559', async () => {
      (fetchUniversalGasPriceEstimate as jest.MockedFunction<
        typeof fetchUniversalGasPriceEstimate
      >).mockResolvedValueOnce({
        baseFee: bigify(100000000000),
        estimate: { maxFeePerGas: '100', maxPriorityFeePerGas: '10' }
      });
      const promise = DexService.instance.getOrderDetailsFrom(
        { ...fNetwork, supportsEIP1559: true },
        { ...fAccount, wallet: WalletId.LEDGER_NANO_S_NEW },
        fRopDAI,
        fAssets[0],
        '1'
      );
      mockAxios.mockResponse({
        data: { ...fSwapQuote }
      });
      const result = await promise;
      expect(result.approvalTx).toStrictEqual({
        chainId: fNetwork.chainId,
        data:
          '0x095ea7b3000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        maxFeePerGas: '0x174876e800',
        maxPriorityFeePerGas: '0x2540be400',
        from: fAccount.address,
        to: '0x6b175474e89094c44da98b954eedeac495271d0f',
        txType: 'APPROVAL',
        type: 2,
        value: '0x0'
      });
      expect(result.tradeTx).toStrictEqual({
        chainId: fNetwork.chainId,
        data:
          '0xd9627aa400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000002429108b8f331000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000096596a1ef6601a8b3a',
        maxFeePerGas: '0x174876e800',
        maxPriorityFeePerGas: '0x2540be400',
        to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        txType: 'SWAP',
        type: 2,
        value: '0x0',
        metadata: { receivingAsset: ETHUUID }
      });
    });
  });

  describe('formatTradeTx', () => {
    it('Prepares the value field for the trade tx', () => {
      expect(
        formatTradeTx({
          to: '0xA65440C4CC83D70b44cF244a0da5373acA16a9cb' as ITxToAddress,
          data: '0x5d46ec340000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000e807dc3fe542f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000002a1530c4c41db0b0b2bb646cb5eb1a67b715866700000000000000000000000000000000000000000000000000000000000000010000000000000000000000002a1530c4c41db0b0b2bb646cb5eb1a67b715866700000000000000000000000000000000000000000000000000000000000000a4ddf7e1a700000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000e807dc3fe542f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000005e6275fe0000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000' as ITxData,
          value: '50000' as ITxValue,
          gas: { gasPrice: '154', maxFeePerGas: undefined, maxPriorityFeePerGas: undefined },
          network: { ...fNetworks[0], supportsEIP1559: false },
          account: fAccount,
          buyToken: { name: 'Ethereum', ticker: 'ETH' as TTicker, uuid: ETHUUID as TUuid }
        })
      ).toEqual({
        to: '0xA65440C4CC83D70b44cF244a0da5373acA16a9cb' as ITxToAddress,
        data: '0x5d46ec340000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000e807dc3fe542f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000002a1530c4c41db0b0b2bb646cb5eb1a67b715866700000000000000000000000000000000000000000000000000000000000000010000000000000000000000002a1530c4c41db0b0b2bb646cb5eb1a67b715866700000000000000000000000000000000000000000000000000000000000000a4ddf7e1a700000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000e807dc3fe542f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000005e6275fe0000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000' as ITxData,
        value: '0xc350' as ITxValue,
        gasPrice: '0x23db1d8400' as ITxGasPrice,
        chainId: 1,
        txType: ITxType.SWAP,
        metadata: { receivingAsset: ETHUUID }
      });
    });
  });
});