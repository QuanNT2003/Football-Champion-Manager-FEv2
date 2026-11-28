import { useTranslation } from '../i18n';
import React, { useState, useEffect, useRef } from 'react';
import { financesApi } from '../services/finances.service';
import { SponsorsModal } from './SponsorsModal';
import './finances.css';
import { SponsorList } from './SponsorList';
import { SponsorshipSummary, sponsorshipsApi } from '../services/sponsorships.service';
import { formatSponsorAmount, localizeSponsorSeason, localizeSponsorshipDescription } from '../utils/sponsorshipLocalization';
import { FinancialAccount, LedgerTransaction, ShopItem } from '../types';
import { DollarSign, Coins, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingBag, CreditCard, RefreshCw, Handshake } from 'lucide-react';

interface FinancesViewProps {
  currentClubId: string;
  onRefreshBalance: () => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({ currentClubId, onRefreshBalance }) => {
  const { t, language } = useTranslation();
  const [balance, setBalance] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sponsorsOpen, setSponsorsOpen] = useState(false);
  const [sponsorships, setSponsorships] = useState<SponsorshipSummary | null>(null);
  const [sponsorsError, setSponsorsError] = useState(false);
  const requestSequence = useRef(0);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setSponsorsOpen(false);
    setBalance(null);
    setTransactions([]);
    setSponsorships(null);
    setSponsorsError(false);
    setFeedback(null);
    loadFinances();
    return () => { requestSequence.current++; };
  }, [currentClubId]);

  const loadFinances = async () => {
    const sequence = ++requestSequence.current;
    try {
      setLoading(true);
      const [bal, txs, shop, sponsors] = await Promise.all([
        financesApi.getBalance(currentClubId),
        financesApi.getTransactions(currentClubId).catch(() => []),
        financesApi.getShop().catch(() => []),
        sponsorshipsApi.get(currentClubId).catch(() => null),
      ]);
      if (sequence !== requestSequence.current) return;
      setBalance(bal);
      setTransactions(Array.isArray(txs) ? txs : []);
      setShopItems(Array.isArray(shop) ? shop : []);
      setSponsorships(sponsors);
      setSponsorsError(sponsors === null);
    } catch (err) {
      if (sequence !== requestSequence.current) return;
      console.error('Failed to load finances:', err);
      setBalance(null);
      setSponsorsError(true);
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  };

  const handleBuyItem = async (item: ShopItem) => {
    if (!balance || (balance.gold_balance || 0) < item.gold_cost) {
      setFeedback({ type: 'error', message: t('finances.shop_insufficient_gold') });
      return;
    }
    try {
      setBuyingId(item.id);
      setFeedback(null);
      await financesApi.buyShopItem({ club_id: currentClubId, item_id: item.id });
      setFeedback({ type: 'success', message: t('finances.exchange_success', { gold: item.gold_cost, cash: formatMoney(item.cash_reward) }) });
      void loadFinances();
      onRefreshBalance();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || t('finances.exchange_error') });
    } finally {
      setBuyingId(null);
    }
  };

  const formatMoney = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div className="view-container finances-view">
      <header className="finances-header">
        <div className="finances-heading">
          <CreditCard className="finances-heading-icon" size={25} />
          <div>
            <h1>{t('finances.title')}</h1>
            <p>{t('finances.subtitle')}</p>
          </div>
        </div>
        <div className="finances-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setSponsorsOpen(true)}>
            <Handshake size={16} />{t('sponsors.title')}
          </button>
          <button className="btn btn-outline btn-sm" disabled={loading} onClick={loadFinances}>
            <RefreshCw size={15} className={loading ? 'spinner-icon' : undefined} />{t('common.refresh')}
          </button>
        </div>
      </header>

      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={'alert alert-' + feedback.type + ' finances-feedback'}>{feedback.message}</div>}

      <div className="finances-summary">
        <section className="finances-stat finances-stat-cash">
          <div className="finances-stat-label"><span>{t('finances.cash_balance')}</span><DollarSign size={21} /></div>
          <div className="finances-stat-value">{balance ? formatMoney(Number(balance.cash_balance)) : '—'}</div>
          <p>{t('finances.cash_hint')}</p>
        </section>
        <section className="finances-stat finances-stat-gold">
          <div className="finances-stat-label"><span>{t('finances.gold_balance')}</span><Coins size={21} /></div>
          <div className="finances-stat-value">{balance ? balance.gold_balance.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : '—'} <small>GOLD</small></div>
          <p>{t('finances.gold_hint')}</p>
        </section>
        <section className="finances-stat finances-stat-health">
          <div className="finances-stat-label"><span>{t('finances.health')}</span><TrendingUp size={21} /></div>
          <div className="finances-stat-value">{t('finances.health_grade')}</div>
          <p>{t('finances.health_hint')}</p>
        </section>
      </div>

      <section className="finances-panel finances-sponsors" aria-busy={loading}>
        <header className="finances-panel-header">
          <div className="finances-panel-heading">
            <h2><Handshake size={19} className="text-warning" />{t('sponsors.current')}{sponsorships && <span className="sponsors-count">{sponsorships.contracts.length}/{sponsorships.max_contracts}</span>}</h2>
            {sponsorships && <p>{localizeSponsorSeason(sponsorships.season_name, language, sponsorships.season_number)}<span className="finances-meta-divider">·</span>{t('sponsors.income')}: <strong className="text-success">{formatSponsorAmount(sponsorships.total_income, language)}</strong></p>}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setSponsorsOpen(true)}>{t('sponsors.view_offers')}<ArrowUpRight size={14} /></button>
        </header>
        {sponsorsError ? <p className="finances-empty" role="alert">{t('sponsors.load_error')}</p> : sponsorships ? (
          sponsorships.contracts.length ? <SponsorList sponsors={sponsorships.contracts} /> : <p className="finances-empty">{t('sponsors.no_contracts')}</p>
        ) : <p className="finances-empty" role="status">{t('sponsors.loading_contracts')}</p>}
      </section>

      <div className="finances-details-grid">
        <section className="finances-panel">
          <header className="finances-panel-header"><div className="finances-panel-heading"><h2><TrendingUp size={19} className="text-primary" />{t('finances.tab_transactions')}</h2></div></header>
          {transactions.length === 0 ? <p className="finances-empty">{t('finances.no_transactions')}</p> : (
            <div className="finances-ledger">
              {transactions.slice(0, 15).map(tx => {
                const isIncome = Number(tx.amount) > 0;
                return <div key={tx.id} className="finances-ledger-row">
                  <span className={'finances-ledger-icon ' + (isIncome ? 'is-income' : 'is-expense')}>{isIncome ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span>
                  <div className="finances-ledger-copy">
                    <strong>{tx.transaction_type === 'SPONSORSHIP' ? localizeSponsorshipDescription(tx.description, language) : tx.description || tx.transaction_type}</strong>
                    <span>{new Date(tx.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB')}<span className="finances-meta-divider">·</span>{tx.transaction_type === 'SPONSORSHIP' ? t('sponsors.transaction_type') : tx.transaction_type}</span>
                  </div>
                  <div className="finances-ledger-amount">
                    <strong className={isIncome ? 'text-success' : 'text-danger'}>{isIncome ? '+' : ''}{tx.transaction_type === 'SPONSORSHIP' ? formatSponsorAmount(Number(tx.amount), language) : formatMoney(Number(tx.amount))}</strong>
                    {Number.isFinite(tx.balance_after) && <span>{t('finances.balance_after')}: {formatMoney(Number(tx.balance_after))}</span>}
                  </div>
                </div>;
              })}
            </div>
          )}
        </section>

        <section className="finances-panel">
          <header className="finances-panel-header"><div className="finances-panel-heading"><h2><ShoppingBag size={19} className="text-warning" />{t('finances.exchange_title')}</h2></div></header>
          <div className="finances-shop-body">
            <p className="finances-shop-intro">{t('finances.exchange_hint')}</p>
            {shopItems.length === 0 ? <p className="finances-empty">{t('finances.shop_empty')}</p> : (
              <div className="finances-shop-list">
                {shopItems.map(item => {
                  const canAfford = (balance?.gold_balance || 0) >= item.gold_cost;
                  return <div key={item.id} className="finances-shop-row">
                    <div className="finances-shop-copy">
                      <strong>{item.name}</strong>
                      <div className="finances-shop-price"><span className="text-warning"><Coins size={14} />{item.gold_cost.toLocaleString()} Gold</span><ArrowUpRight size={14} className="text-muted" /><span className="text-success">+{formatMoney(item.cash_reward)}</span></div>
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={!canAfford || buyingId !== null} onClick={() => handleBuyItem(item)}>{t(buyingId === item.id ? 'finances.exchanging' : 'finances.exchange')}</button>
                  </div>;
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      {sponsorsOpen && <SponsorsModal key={currentClubId} clubId={currentClubId} onClose={() => setSponsorsOpen(false)} onSigned={updated => { setSponsorships(updated); void loadFinances(); onRefreshBalance(); }} />}
    </div>
  );
};
