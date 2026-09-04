/**
 * Utility formatting functions for Indian SME financial metrics
 */

export const formatINR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "₹0";
  const num = Number(value);
  
  // Format with Indian numbering system (Lakhs & Crores if large, or standard comma grouping)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatCompactINR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "₹0";
  const num = Math.abs(Number(value));
  const sign = value < 0 ? "-" : "";

  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${num.toFixed(0)}`;
};

export const formatPct = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return `${Number(value).toFixed(1)}%`;
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat('en-IN').format(Number(value));
};

