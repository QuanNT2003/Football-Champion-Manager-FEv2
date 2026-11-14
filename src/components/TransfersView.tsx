import { useTranslation } from '../i18n';
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { transfersApi, StaffMarketItem, FilterOptionsResponse } from '../services/transfers.service';
import { Player } from '../types';
import { ShoppingCart, Users } from 'lucide-react';

import { PlayerMarketTable } from './transfers/PlayerMarketTable';
import { StaffMarketTable } from './transfers/StaffMarketTable';
import { PlayerDetailModal } from './player';
import { StaffDetailModal } from './staff';
import { PlayerSkillFilterModal, SkillFilterValues } from './transfers/PlayerSkillFilterModal';
import { StaffFilterModal, StaffFilterValues } from './transfers/StaffFilterModal';

interface TransfersViewProps {
  currentClubId: string;
  cashBalance: number;
  onRefreshFinance: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  currentClubId,
  cashBalance,
  onRefreshFinance,
}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isStaffMarket = searchParams.get('tab') === 'staff';

  // Player Market States
  const [marketPlayers, setMarketPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'LOAN' | 'TRANSFER'>('ALL');
  const [positionFilter, setPositionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Advanced & Skill Filter States
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [nationalityId, setNationalityId] = useState<string>('');
  const [minOvr, setMinOvr] = useState<number | undefined>();
  const [maxOvr, setMaxOvr] = useState<number | undefined>();
  const [attributeFilters, setAttributeFilters] = useState<Record<string, number>>({});
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);

  // Staff Market States
  const [staffList, setStaffList] = useState<StaffMarketItem[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [staffLicenseFilter, setStaffLicenseFilter] = useState('');
  const [staffTacticalStyleFilter, setStaffTacticalStyleFilter] = useState('');
  const [staffFormationFilter, setStaffFormationFilter] = useState('');
  const [staffNationalityId, setStaffNationalityId] = useState('');
  const [staffMinAge, setStaffMinAge] = useState<number | undefined>();
  const [staffMaxAge, setStaffMaxAge] = useState<number | undefined>();
  const [staffMinOvr, setStaffMinOvr] = useState<number | undefined>();
  const [staffMaxOvr, setStaffMaxOvr] = useState<number | undefined>();
  const [staffAttributeFilters, setStaffAttributeFilters] = useState<Record<string, number>>({});
  const [isStaffFilterModalOpen, setIsStaffFilterModalOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotalPages, setStaffTotalPages] = useState(1);
  const [staffTotalItems, setStaffTotalItems] = useState(0);
  const [selectedStaffForHire, setSelectedStaffForHire] = useState<StaffMarketItem | null>(null);
  const [staffDetailInitialTab, setStaffDetailInitialTab] = useState<'skills' | 'history' | 'offer'>('skills');

  // Player Detail & Offer Modal
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'skills' | 'offer'>('skills');

  // Load filter metadata một lần khi mở view
  useEffect(() => {
    transfersApi.getFilterOptions()
      .then((res) => {
        setFilterOptions(res);
      })
      .catch(() => {});
  }, []);

  // Tính số lượng tiêu chí lọc nâng cao đang kích hoạt (Player)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter && statusFilter !== 'ALL') count++;
    if (positionFilter) count++;
    if (minAge !== undefined || maxAge !== undefined) count++;
    if (minPrice !== undefined || maxPrice !== undefined) count++;
    if (nationalityId) count++;
    if (minOvr !== undefined || maxOvr !== undefined) count++;
    for (const val of Object.values(attributeFilters)) {
      if (val > 0) count++;
    }
    return count;
  }, [statusFilter, positionFilter, minAge, maxAge, minPrice, maxPrice, nationalityId, minOvr, maxOvr, attributeFilters]);

  // Tính số lượng tiêu chí lọc nâng cao đang kích hoạt (Staff)
  const staffActiveFilterCount = useMemo(() => {
    let count = 0;
    if (staffRoleFilter) count++;
    if (staffLicenseFilter) count++;
    if (staffTacticalStyleFilter) count++;
    if (staffFormationFilter) count++;
    if (staffNationalityId) count++;
    if (staffMinAge !== undefined || staffMaxAge !== undefined) count++;
    if (staffMinOvr !== undefined || staffMaxOvr !== undefined) count++;
    for (const val of Object.values(staffAttributeFilters)) {
      if (val > 0) count++;
    }
    return count;
  }, [
    staffRoleFilter,
    staffLicenseFilter,
    staffTacticalStyleFilter,
    staffFormationFilter,
    staffNationalityId,
    staffMinAge,
    staffMaxAge,
    staffMinOvr,
    staffMaxOvr,
    staffAttributeFilters,
  ]);

  // Load Market data khi các filter chính thay đổi
  useEffect(() => {
    if (isStaffMarket) {
      loadStaff();
    } else {
      loadMarket();
    }
  }, [
    isStaffMarket,
    page,
    statusFilter,
    positionFilter,
    minAge,
    maxAge,
    minPrice,
    maxPrice,
    nationalityId,
    minOvr,
    maxOvr,
    attributeFilters,
    staffPage,
    staffRoleFilter,
    staffLicenseFilter,
    staffTacticalStyleFilter,
    staffFormationFilter,
    staffNationalityId,
    staffMinAge,
    staffMaxAge,
    staffMinOvr,
    staffMaxOvr,
    staffAttributeFilters,
  ]);

  const loadMarket = async () => {
    try {
      setLoading(true);
      const data: any = await transfersApi.getMarket({
        search: search || undefined,
        status: statusFilter,
        position: positionFilter || undefined,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        nationalityId: nationalityId || undefined,
        minOvr,
        maxOvr,
        attributes: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
        page,
        limit: 15
      });
      const items = data.items || (Array.isArray(data) ? data : []);
      const total = Number(data.total) || items.length;
      setMarketPlayers(items);
      setTotalItems(total);
      setTotalPages(data.totalPages || Math.ceil(total / 15) || 1);
    } catch (err) {
      console.error('Failed to load market:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      setStaffLoading(true);
      const data: any = await transfersApi.getStaffMarket({
        search: staffSearch || undefined,
        role: staffRoleFilter || undefined,
        license: staffLicenseFilter || undefined,
        tacticalStyle: staffTacticalStyleFilter || undefined,
        formationId: staffFormationFilter || undefined,
        nationalityId: staffNationalityId || undefined,
        minAge: staffMinAge,
        maxAge: staffMaxAge,
        minOvr: staffMinOvr,
        maxOvr: staffMaxOvr,
        attributes: Object.keys(staffAttributeFilters).length > 0 ? staffAttributeFilters : undefined,
        page: staffPage,
        limit: 15
      });
      const items = data?.items || [];
      const total = Number(data?.total) || items.length;
      setStaffList(items);
      setStaffTotalItems(total);
      setStaffTotalPages(data?.totalPages || Math.ceil(total / 15) || 1);
    } catch (err) {
      console.error('Failed to load staff market:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMarket();
  };

  const handleStaffSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffPage(1);
    loadStaff();
  };

  const handleApplySkillFilters = (values: SkillFilterValues) => {
    if (values.status) setStatusFilter(values.status);
    if (values.position !== undefined) setPositionFilter(values.position);
    setMinAge(values.minAge);
    setMaxAge(values.maxAge);
    setMinPrice(values.minPrice);
    setMaxPrice(values.maxPrice);
    setNationalityId(values.nationalityId || '');
    setMinOvr(values.minOvr);
    setMaxOvr(values.maxOvr);
    setAttributeFilters(values.attributes);
    setPage(1);
  };

  const handleResetSkillFilters = () => {
    setStatusFilter('ALL');
    setPositionFilter('');
    setMinAge(undefined);
    setMaxAge(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setNationalityId('');
    setMinOvr(undefined);
    setMaxOvr(undefined);
    setAttributeFilters({});
    setPage(1);
  };

  const handleApplyStaffFilters = (values: StaffFilterValues) => {
    if (values.role !== undefined) setStaffRoleFilter(values.role);
    setStaffLicenseFilter(values.license || '');
    setStaffTacticalStyleFilter(values.tacticalStyle || '');
    setStaffFormationFilter(values.formationId || '');
    setStaffNationalityId(values.nationalityId || '');
    setStaffMinAge(values.minAge);
    setStaffMaxAge(values.maxAge);
    setStaffMinOvr(values.minOvr);
    setStaffMaxOvr(values.maxOvr);
    setStaffAttributeFilters(values.attributes);
    setStaffPage(1);
  };

  const handleResetStaffFilters = () => {
    setStaffRoleFilter('');
    setStaffLicenseFilter('');
    setStaffTacticalStyleFilter('');
    setStaffFormationFilter('');
    setStaffNationalityId('');
    setStaffMinAge(undefined);
    setStaffMaxAge(undefined);
    setStaffMinOvr(undefined);
    setStaffMaxOvr(undefined);
    setStaffAttributeFilters({});
    setStaffPage(1);
  };

  const handleOpenOfferTab = (player: Player) => {
    setSelectedPlayerForDetail(player);
    setDetailInitialTab('offer');
  };

  const handleOpenDetailModal = (player: Player) => {
    setSelectedPlayerForDetail(player);
    setDetailInitialTab('skills');
  };

  const handleOpenStaffDetail = (staff: StaffMarketItem) => {
    setSelectedStaffForHire(staff);
    setStaffDetailInitialTab('skills');
  };

  const handleOpenStaffOffer = (staff: StaffMarketItem) => {
    setSelectedStaffForHire(staff);
    setStaffDetailInitialTab('offer');
  };


  return (
    <div className="view-container">
      <nav className="btn-group flex-wrap" aria-label={t('v2.transferMarket')}>
        <Link
          to="/transfers"
          className={`btn btn-sm ${isStaffMarket ? 'btn-outline' : 'btn-primary'}`}
          aria-current={!isStaffMarket ? 'page' : undefined}
        >
          <ShoppingCart size={15} />
          {t('transfers.tab_players')}
        </Link>
        <Link
          to="/transfers?tab=staff"
          className={`btn btn-sm ${isStaffMarket ? 'btn-primary' : 'btn-outline'}`}
          aria-current={isStaffMarket ? 'page' : undefined}
        >
          <Users size={15} />
          {t('transfers.tab_staff')}
        </Link>
      </nav>

      {isStaffMarket ? (
        <StaffMarketTable
          staffList={staffList}
          loading={staffLoading}
          currentClubId={currentClubId}
          search={staffSearch}
          roleFilter={staffRoleFilter}
          activeFilterCount={staffActiveFilterCount}
          page={staffPage}
          totalPages={staffTotalPages}
          totalItems={staffTotalItems}
          onSearchChange={setStaffSearch}
          onSearchSubmit={handleStaffSearchSubmit}
          onRoleFilterChange={(role) => {
            setStaffRoleFilter(role);
            setStaffPage(1);
          }}
          onOpenFilterModal={() => setIsStaffFilterModalOpen(true)}
          onResetFilters={handleResetStaffFilters}
          onPageChange={setStaffPage}
          onSelectStaff={handleOpenStaffDetail}
          onOpenOfferModal={handleOpenStaffOffer}
          onOpenHireModal={handleOpenStaffOffer}
        />
      ) : (
        <PlayerMarketTable
          players={marketPlayers}
          loading={loading}
          currentClubId={currentClubId}
          search={search}
          statusFilter={statusFilter}
          positionFilter={positionFilter}
          activeFilterCount={activeFilterCount}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          onOpenSkillModal={() => setIsSkillModalOpen(true)}
          onResetFilters={handleResetSkillFilters}
          onPageChange={setPage}
          onSelectPlayer={handleOpenDetailModal}
          onOpenOfferModal={handleOpenOfferTab}
        />
      )}

      {/* MODAL 1: BỘ LỌC KỸ NĂNG & NÂNG CAO CẦU THỦ */}
      <PlayerSkillFilterModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        filterOptions={filterOptions}
        currentValues={{
          status: statusFilter,
          position: positionFilter,
          minAge,
          maxAge,
          minPrice,
          maxPrice,
          nationalityId,
          minOvr,
          maxOvr,
          attributes: attributeFilters,
        }}
        onApply={handleApplySkillFilters}
        onReset={handleResetSkillFilters}
      />

      {/* MODAL 2: BỘ LỌC KỸ NĂNG & NÂNG CAO NHÂN VIÊN */}
      <StaffFilterModal
        isOpen={isStaffFilterModalOpen}
        onClose={() => setIsStaffFilterModalOpen(false)}
        filterOptions={filterOptions}
        currentValues={{
          role: staffRoleFilter,
          license: staffLicenseFilter,
          tacticalStyle: staffTacticalStyleFilter,
          formationId: staffFormationFilter,
          nationalityId: staffNationalityId,
          minAge: staffMinAge,
          maxAge: staffMaxAge,
          minOvr: staffMinOvr,
          maxOvr: staffMaxOvr,
          attributes: staffAttributeFilters,
        }}
        onApply={handleApplyStaffFilters}
        onReset={handleResetStaffFilters}
      />

      {/* MODAL 2: CHI TIẾT CẦU THỦ & ĐỀ NGHỊ CHUYỂN NHƯỢNG (TAB OFFER) */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          player={selectedPlayerForDetail}
          playersList={marketPlayers}
          currentClubId={currentClubId}
          cashBalance={cashBalance}
          initialTab={detailInitialTab}
          onClose={() => setSelectedPlayerForDetail(null)}
          onSelectPlayer={(p) => setSelectedPlayerForDetail(p)}
          onOfferSuccess={onRefreshFinance}
        />
      )}

      {/* MODAL 3: TUYỂN DỤNG NHÂN VIÊN */}
      {/* MODAL CHI TIẾT & ĐỀ NGHỊ TUYỂN MỘ NHÂN SỰ */}
      {selectedStaffForHire && (
        <StaffDetailModal
          staff={selectedStaffForHire}
          staffList={staffList}
          currentClubId={currentClubId}
          cashBalance={cashBalance}
          initialTab={staffDetailInitialTab}
          onClose={() => setSelectedStaffForHire(null)}
          onSelectStaff={(st) => setSelectedStaffForHire(st)}
          onOfferSuccess={() => {
            loadStaff();
            onRefreshFinance();
          }}
        />
      )}
    </div>
  );
};
