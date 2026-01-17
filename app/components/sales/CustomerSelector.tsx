import { useState, useEffect, useRef } from "react";
import { Link } from "@remix-run/react";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";

export interface Customer {
  _id: string;
  fullName: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  socialMedia?: {
    source: string;
    username?: string;
  };
}

interface CustomerSelectorProps {
  onSelect: (customer: Customer | null) => void;
  onSearch: (search: string) => void;
  selectedCustomer?: Customer | null;
  customers: Customer[];
  loading?: boolean;
}

export function CustomerSelector({
  onSelect,
  onSearch,
  selectedCustomer,
  customers,
  loading = false
}: CustomerSelectorProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Ref para mantener referencia estable a onSearch
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (search.length < 2) {
      return;
    }

    const debounce = setTimeout(() => {
      onSearchRef.current(search);
      setShowResults(true);
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);
  
  if (selectedCustomer) {
    return (
      <Card className="bg-primary-50 border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{selectedCustomer.fullName}</h3>
            {selectedCustomer.documentType && selectedCustomer.documentNumber && (
              <p className="text-sm text-gray-600">
                {selectedCustomer.documentType}: {selectedCustomer.documentNumber}
              </p>
            )}
            {selectedCustomer.socialMedia && (
              <p className="text-sm text-gray-600 capitalize">
                {selectedCustomer.socialMedia.source}
                {selectedCustomer.socialMedia.username && `: @${selectedCustomer.socialMedia.username}`}
              </p>
            )}
            {selectedCustomer.email && (
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
            )}
            {selectedCustomer.phone && (
              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSearch('');
              setShowResults(false);
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Change
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="relative">
      <Input
        type="text"
        label="Search Customer"
        placeholder="Search by name, document, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setShowResults(true)}
      />
      
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {customers.map((customer) => (
            <button
              key={customer._id}
              type="button"
              onClick={() => {
                onSelect(customer);
                setShowResults(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <div className="font-medium text-gray-900">{customer.fullName}</div>
              <div className="text-sm text-gray-600">
                {customer.documentType && customer.documentNumber && (
                  <span>{customer.documentType}: {customer.documentNumber}</span>
                )}
                {customer.socialMedia && (
                  <span className="capitalize">
                    {customer.documentType && customer.documentNumber ? ' · ' : ''}
                    {customer.socialMedia.source}
                    {customer.socialMedia.username && ` @${customer.socialMedia.username}`}
                  </span>
                )}
                {customer.phone && (
                  <span> · {customer.phone}</span>
                )}
              </div>
            </button>
          ))}
          {search.length >= 2 && (
            <Link
              to="/customers/new"
              className="block w-full text-left px-4 py-3 hover:bg-primary-50 border-t border-gray-200 text-primary-600 font-medium transition-colors"
            >
              + Create new customer
            </Link>
          )}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-10 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}
