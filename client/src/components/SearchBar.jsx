import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { debounce } from '../utils/helpers';

const SearchBar = ({ onSearch, onFilterChange, filters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    fileType: '',
    sortBy: 'name',
    sortOrder: 'ASC',
    ...filters
  });

  // Debounced search function
  const debouncedSearch = debounce((term) => {
    onSearch(term);
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    onFilterChange(localFilters);
  }, [localFilters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const resetFilters = () => {
    const defaultFilters = {
      fileType: '',
      sortBy: 'name',
      sortOrder: 'ASC'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const fileTypes = [
    { value: '', label: 'All Files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'text', label: 'Text Files' },
    { value: 'archive', label: 'Archives' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'file_size', label: 'Size' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'original_name', label: 'Original Name' }
  ];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search files and folders..."
          className="input pl-10 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>

        {(localFilters.fileType || localFilters.sortBy !== 'name' || localFilters.sortOrder !== 'ASC') && (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                value={localFilters.fileType}
                onChange={(e) => handleFilterChange('fileType', e.target.value)}
                className="input"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={localFilters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="input"
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(localFilters.fileType || searchTerm) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={clearSearch}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {localFilters.fileType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Type: {fileTypes.find(t => t.value === localFilters.fileType)?.label}
                  <button
                    onClick={() => handleFilterChange('fileType', '')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;