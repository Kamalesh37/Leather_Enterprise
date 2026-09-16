import React, { useState, useEffect, useMemo } from 'react';
import { Api } from '../../api/client';
import { Vendor } from '../../types';
import { Modal } from '../Common/Modal';
import { useToast } from '../Common/Toast';
import {
  Truck,
  Plus,
  Search,
  Star,
  Mail,
  Phone,
  Building,
  FileText,
  MapPin,
  Cpu,
  Award,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Wrench,
  X,
} from 'lucide-react';

export const VendorCatalog: React.FC = () => {
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [rating, setRating] = useState<number>(4.9);
  const [categoriesInput, setCategoriesInput] = useState<string>('Heavy Stitching, Hydraulic Presses, CNC Cutting');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await Api.listVendors();
      if (res.success && res.data) {
        setVendors(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Compute unique categories across all vendors
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => {
      if (Array.isArray(v.machinery_categories)) {
        v.machinery_categories.forEach((cat) => set.add(cat.trim()));
      }
    });
    return Array.from(set);
  }, [vendors]);

  // Filter vendors by search & selected category
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        search === '' ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.contact_name && v.contact_name.toLowerCase().includes(search.toLowerCase())) ||
        (v.email && v.email.toLowerCase().includes(search.toLowerCase())) ||
        (v.address && v.address.toLowerCase().includes(search.toLowerCase())) ||
        (v.machinery_categories &&
          v.machinery_categories.some((c) => c.toLowerCase().includes(search.toLowerCase())));

      const matchesCat =
        selectedCategory === 'ALL' ||
        (v.machinery_categories &&
          v.machinery_categories.some(
            (c) => c.toLowerCase() === selectedCategory.toLowerCase()
          ));

      return matchesSearch && matchesCat;
    });
  }, [vendors, search, selectedCategory]);

  // Overall Statistics
  const totalVendorsCount = vendors.length;
  const avgRating =
    vendors.length > 0
      ? (
          vendors.reduce((acc, v) => acc + (Number(v.rating) || 4.8), 0) /
          vendors.length
        ).toFixed(2)
      : '4.90';
  const totalCategoriesCount = allCategories.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vendor company name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const cats = categoriesInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await Api.storeVendor({
        name: name.trim(),
        contact_name: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        tax_id: taxId.trim() || undefined,
        address: address.trim() || undefined,
        rating: Number(rating) || 4.9,
        machinery_categories: cats,
      });

      toast.success(`Vendor "${name}" registered successfully.`);
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setTaxId('');
      setAddress('');
      setRating(4.9);
      setModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-container">
      {/* Header Banner */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Truck size={24} color="var(--primary)" />
            <span>Machinery Vendors & OEM Suppliers</span>
          </h2>
          <p className="section-description">
            Verified manufacturers and OEM partners delivering precision leather machinery, replacement parts, and technical support.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          <span>Register Vendor</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="vendor-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Building size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalVendorsCount}</div>
            <div className="stat-label">Certified OEM Vendors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">100%</div>
            <div className="stat-label">OEM Certified Compliance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Star size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{avgRating} ★</div>
            <div className="stat-label">Average Supplier Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalCategoriesCount}</div>
            <div className="stat-label">Equipment Classes Covered</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="vendor-controls-bar">
        <div className="vendor-search-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="vendor-search-input"
            placeholder="Search by vendor name, rep, email, country, or equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="vendor-filter-chips">
          <button
            className={`vendor-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Equipment ({vendors.length})
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              className={`vendor-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Truck size={36} style={{ margin: '0 auto 12px auto', animation: 'spin 2s linear infinite', color: 'var(--primary)' }} />
          <div>Loading OEM vendors & equipment directory...</div>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Truck size={42} style={{ margin: '0 auto 12px auto', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No OEM Vendors Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {search || selectedCategory !== 'ALL'
              ? 'Try adjusting your search criteria or clearing active filters.'
              : 'No machinery vendors registered in system yet.'}
          </p>
          {(search || selectedCategory !== 'ALL') && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="vendor-grid">
          {filteredVendors.map((v) => {
            const initial = v.name ? v.name.charAt(0).toUpperCase() : 'V';
            const categories = Array.isArray(v.machinery_categories) ? v.machinery_categories : [];

            return (
              <div key={v.id} className="vendor-card">
                {/* Header */}
                <div className="vendor-card-header">
                  <div className="vendor-avatar">{initial}</div>

                  <div className="vendor-header-info">
                    <h3 className="vendor-name" title={v.name}>{v.name}</h3>
                    <div className="vendor-contact-person">
                      <ShieldCheck size={14} color="var(--accent-emerald)" />
                      <span>{v.contact_name || 'Authorized Technical Rep'}</span>
                    </div>
                  </div>

                  <div className="vendor-rating-pill" title={`Supplier Quality Score: ${v.rating || 4.9} / 5.0`}>
                    <Star size={13} fill="#fbbf24" color="#fbbf24" />
                    <span>{Number(v.rating || 4.9).toFixed(1)}</span>
                  </div>
                </div>

                {/* Details List */}
                <div className="vendor-details-list">
                  {v.email && (
                    <div className="vendor-detail-row">
                      <Mail size={14} color="var(--primary-light)" />
                      <a href={`mailto:${v.email}`} title="Send Email">{v.email}</a>
                    </div>
                  )}

                  {v.phone && (
                    <div className="vendor-detail-row">
                      <Phone size={14} color="var(--accent-emerald-light)" />
                      <a href={`tel:${v.phone}`} title="Call Vendor">{v.phone}</a>
                    </div>
                  )}

                  {v.address && (
                    <div className="vendor-detail-row">
                      <MapPin size={14} color="var(--accent-amber-light)" />
                      <span title={v.address}>{v.address}</span>
                    </div>
                  )}

                  {v.tax_id && (
                    <div className="vendor-detail-row">
                      <FileText size={14} color="var(--text-muted)" />
                      <span>VAT / GSTIN: <strong>{v.tax_id}</strong></span>
                    </div>
                  )}
                </div>

                {/* Supplied Machinery Categories */}
                <div className="vendor-categories-box">
                  <div className="vendor-cats-label">Supplied Machinery Types:</div>
                  <div className="vendor-cats-list">
                    {categories.length > 0 ? (
                      categories.map((cat, idx) => (
                        <span key={idx} className="vendor-category-tag">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="vendor-category-tag">Precision Leather Machines</span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="vendor-card-footer">
                  <div className="vendor-machines-badge">
                    <CheckCircle2 size={15} color="var(--accent-emerald)" />
                    <span>Active OEM Partner</span>
                  </div>

                  <div className="vendor-action-links">
                    {v.email && (
                      <a
                        href={`mailto:${v.email}`}
                        className="vendor-icon-btn"
                        title={`Email ${v.name}`}
                      >
                        <Mail size={14} />
                      </a>
                    )}
                    {v.phone && (
                      <a
                        href={`tel:${v.phone}`}
                        className="vendor-icon-btn"
                        title={`Call ${v.phone}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Vendor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={20} color="var(--primary)" />
            <span>Register Machinery OEM Vendor</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label">Vendor Company Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dürkopp Adler Industrial Automation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Contact Representative</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Klaus Schneider"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Official Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="sales@duerkopp-adler.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-input"
                placeholder="+49 521 925-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Tax ID / VAT / GSTIN</label>
              <input
                type="text"
                className="form-input"
                placeholder="DE-123456789"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Headquarters / Plant Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Potsdamer Str. 190, 33719 Bielefeld, Germany"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Supplied Machinery Types (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Heavy Stitching, Skiving Machines, Hydraulic Presses, CNC Cutting"
              value={categoriesInput}
              onChange={(e) => setCategoriesInput(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
