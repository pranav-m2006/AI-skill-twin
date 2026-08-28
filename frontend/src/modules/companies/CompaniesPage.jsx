import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, MapPin, Star, Briefcase, ChevronRight, Globe, Users } from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';

const INDUSTRIES = ['All', 'Product', 'IT Services', 'FinTech', 'E-commerce', 'AI & ML'];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/companies');
      const list = Array.isArray(data) ? data : (data.companies || []);
      setCompanies(list);
    } catch (e) {
      console.error('Failed to load companies:', e);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (Array.isArray(companies) ? companies : []).filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.industry?.toLowerCase().includes(search.toLowerCase()) ||
                        c.location?.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industry === 'All' || c.industry?.toLowerCase() === industry.toLowerCase();
    return matchSearch && matchIndustry;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
          <Building2 size={20} className="text-accent-blue" />
          Top Hiring Companies ({companies.length})
        </h2>
        <p className="text-[12px] text-muted mt-0.5">
          Explore top product & service companies, view hiring requirements, tech stacks, and active job openings.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-border rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-3 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company name or location..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-[12px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Industry Pill Select */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                industry === ind ? 'bg-accent-blue text-white' : 'bg-card text-muted hover:text-text border border-border'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(company => (
          <Card key={company.id} className="p-5 flex flex-col justify-between hover:border-accent-blue/40 transition-all group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue flex-shrink-0">
                    {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover rounded-xl" /> : company.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-text group-hover:text-accent-blue transition-colors">
                      {company.name}
                    </h3>
                    <Badge color="blue" size="xs">{company.industry || 'Tech'}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-accent-amber">
                  <Star size={12} fill="currentColor" />
                  <span>{company.rating || '4.5'}</span>
                </div>
              </div>

              <p className="text-[12px] text-muted line-clamp-2 mb-3 leading-relaxed">
                {company.description || 'Leading technology company providing innovative solutions and high-growth developer opportunities.'}
              </p>

              <div className="flex flex-wrap gap-3 text-[11px] text-muted mb-4">
                {company.location && <span className="flex items-center gap-1"><MapPin size={10} />{company.location}</span>}
                {company.companySize && <span className="flex items-center gap-1"><Users size={10} />{company.companySize}</span>}
              </div>

              {/* Tech Stack Tags */}
              {company.techStack && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(typeof company.techStack === 'string' ? JSON.parse(company.techStack || '[]') : (company.techStack || [])).slice(0, 4).map(tech => (
                    <span key={tech} className="bg-surface px-2 py-0.5 rounded text-[10px] text-muted font-medium border border-border">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] font-medium text-accent-green flex items-center gap-1">
                <Briefcase size={12} />
                {company.jobs?.length || 3} Active Openings
              </span>
              <Link
                to={`/companies/${company.id}`}
                className="text-[11px] font-semibold text-accent-blue hover:underline flex items-center gap-0.5"
              >
                View Profile <ChevronRight size={12} />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <Building2 size={32} className="text-muted mx-auto mb-2" />
          <p className="text-[13px] text-muted">No companies found matching your search filters.</p>
        </Card>
      )}
    </div>
  );
}
