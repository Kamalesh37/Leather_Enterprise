import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  FileText,
  Tag,
  X,
} from 'lucide-react';


export const VendorCatalog: React.FC = () => {
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [categoriesInput, setCategoriesInput] = useState<string>('Heavy Stitching, Hydraulic Presses');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchVendors = async (searchQuery: string = search) => {
    setLoading(true);
    try {
      const res = await Api.listVendors({ search: searchQuery || undefined });
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
    const timer = setTimeout(() => {
      fetchVendors(search);
    }, 220);
    return () => clearTimeout(timer);
  }, [search]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || query.length < 2) return text;
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'rgba(99, 102, 241, 0.45)',
            color: '#fff',
            borderRadius: '2px',
            padding: '0 2px',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
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
        name,
        contact_name: contactName,
        email,
        phone,
        tax_id: taxId,
        address,
        machinery_categories: cats,
      });

      toast.success(`Vendor ${name} registered successfully.`);
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setTaxId('');
      setAddress('');
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
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Truck size={24} color="var(--primary)" />
            <span>Machinery Vendors & OEM Suppliers</span>
          </h2>
          <p className="section-description">
            Directory of certified leather machinery manufacturers, service contracts, and supported equipment categories.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          <span>Register Vendor</span>
        </button>
      </div>

      {/* Live Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: search ? '36px' : '14px' }}
              placeholder="Search by vendor name, contact person, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearch('')}
            >
              Reset Search
            </button>
          )}
        </div>

        {search && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Available Vendors: <strong style={{ color: 'var(--text-primary)' }}>{vendors.length}</strong></span>
            <span className="badge badge-primary">Search: "{search}"</span>
          </div>
        )}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading vendors...
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((v) => (
            <div key={v.id} className="card vendor-card">
              <div className="vendor-card-header">
                <div>
                  <h3 className="vendor-name">{highlightMatch(v.name, search)}</h3>
                  <div className="vendor-contact-person">{highlightMatch(v.contact_name || 'Authorized Technical Rep', search)}</div>
                </div>
                <div className="vendor-rating">
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <span>{v.rating || 4.8}</span>
                </div>
              </div>


              <div className="vendor-details-list">
                {v.email && (
                  <div className="vendor-detail-row">
                    <Mail size={14} color="var(--text-muted)" />
                    <span>{v.email}</span>
                  </div>
                )}
                {v.phone && (
                  <div className="vendor-detail-row">
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{v.phone}</span>
                  </div>
                )}
                {v.tax_id && (
                  <div className="vendor-detail-row">
                    <FileText size={14} color="var(--text-muted)" />
                    <span>Tax ID: {v.tax_id}</span>
                  </div>
                )}
              </div>

              <div className="vendor-categories-box">
                <div className="vendor-cats-label">Supplied Machinery:</div>
                <div className="vendor-cats-list">
                  {v.machinery_categories && v.machinery_categories.length > 0 ? (
                    v.machinery_categories.map((cat, idx) => (
                      <span key={idx} className="badge badge-secondary">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="badge badge-secondary">General Leather Machines</span>
                  )}
                </div>
              </div>

              <div className="vendor-card-footer">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Active Plant Machines: <strong>{v.machines_count ?? 2} units</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Vendor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="var(--primary)" />
            <span>Register Machinery Vendor</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Register Vendor'}
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
              placeholder="e.g. Dürkopp Adler Germany"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Klaus Schneider"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="support@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+49 521 925-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Tax ID (VAT / GSTIN)</label>
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
            <label className="form-label">Machinery Categories (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Heavy Stitching, Hydraulic Presses, Skiving"
              value={categoriesInput}
              onChange={(e) => setCategoriesInput(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
