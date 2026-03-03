/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with { key, label }
 * @returns {string} CSV string
 */
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      let value = item[header.key];
      
      // Handle nested objects
      if (header.key.includes('.')) {
        const keys = header.key.split('.');
        value = keys.reduce((obj, key) => obj?.[key], item);
      }
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          value = value.join('; ');
        } else if (value instanceof Date) {
          value = value.toLocaleDateString();
        } else {
          value = JSON.stringify(value);
        }
      }
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      value = String(value);
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  }).join('\n');
  
  return `${headerRow}\n${dataRows}`;
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV content as string
 * @param {string} filename - Filename without extension
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export alumni data to CSV
 * @param {Array} alumni - Array of alumni objects
 */
export function exportAlumni(alumni) {
  const headers = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'graduationYear', label: 'Graduation Year' },
    { key: 'department', label: 'Department' },
    { key: 'currentPosition', label: 'Current Position' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'bio', label: 'Bio' },
    { key: 'linkedIn', label: 'LinkedIn' },
    { key: 'github', label: 'GitHub' },
    { key: 'website', label: 'Website' },
    { key: 'createdAt', label: 'Registered Date' }
  ];
  
  const processedData = alumni.map(a => ({
    ...a,
    createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''
  }));
  
  const csv = convertToCSV(processedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `alumni_export_${timestamp}`);
}

/**
 * Export events data to CSV
 * @param {Array} events - Array of event objects
 */
export function exportEvents(events) {
  const headers = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Type' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'attendeesCount', label: 'Attendees' },
    { key: 'organizer.name', label: 'Organizer' },
    { key: 'createdAt', label: 'Created Date' }
  ];
  
  const processedData = events.map(e => ({
    ...e,
    date: e.date ? new Date(e.date).toLocaleDateString() : '',
    attendeesCount: e.attendees?.length || 0,
    createdAt: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''
  }));
  
  const csv = convertToCSV(processedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `events_export_${timestamp}`);
}

/**
 * Export donations data to CSV
 * @param {Array} donations - Array of donation objects
 */
export function exportDonations(donations) {
  const headers = [
    { key: 'donor.name', label: 'Donor Name' },
    { key: 'donor.email', label: 'Donor Email' },
    { key: 'amount', label: 'Amount' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'message', label: 'Message' },
    { key: 'isAnonymous', label: 'Anonymous' },
    { key: 'date', label: 'Date' },
    { key: 'paymentMethod', label: 'Payment Method' }
  ];
  
  const processedData = donations.map(d => ({
    ...d,
    amount: `$${d.amount?.toFixed(2) || '0.00'}`,
    isAnonymous: d.isAnonymous ? 'Yes' : 'No',
    date: d.date ? new Date(d.date).toLocaleDateString() : '',
  }));
  
  const csv = convertToCSV(processedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `donations_export_${timestamp}`);
}

/**
 * Export jobs data to CSV
 * @param {Array} jobs - Array of job objects
 */
export function exportJobs(jobs) {
  const headers = [
    { key: 'title', label: 'Job Title' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'type', label: 'Job Type' },
    { key: 'description', label: 'Description' },
    { key: 'requirements', label: 'Requirements' },
    { key: 'salary', label: 'Salary' },
    { key: 'applicationDeadline', label: 'Application Deadline' },
    { key: 'postedBy.name', label: 'Posted By' },
    { key: 'createdAt', label: 'Posted Date' }
  ];
  
  const processedData = jobs.map(j => ({
    ...j,
    applicationDeadline: j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString() : '',
    createdAt: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : ''
  }));
  
  const csv = convertToCSV(processedData, headers);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `jobs_export_${timestamp}`);
}
