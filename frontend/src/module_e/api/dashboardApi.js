import axiosInstance from '../../common/api/axiosInstance';

export async function getStatusDashboard() {
  const response = await axiosInstance.get('/admin/dashboard/status-overview');
  return response.data.data;
}

export async function getCategoryDashboard() {
  const response = await axiosInstance.get('/admin/dashboard/category-overview');
  return response.data.data;
}

export async function getTagDashboard() {
  const response = await axiosInstance.get('/admin/dashboard/tag-overview');
  return response.data.data;
}

export async function getContributorDashboard() {
  const response = await axiosInstance.get('/admin/dashboard/contributor-overview');
  return response.data.data;
}

export async function downloadStatusDashboardReport() {
  const response = await axiosInstance.get('/admin/dashboard/status-overview/report', {
    responseType: 'blob',
  });
  downloadBlob(response.data, 'resource-status-dashboard-report.csv');
}

export async function downloadCategoryDashboardReport() {
  const response = await axiosInstance.get('/admin/dashboard/category-overview/report', {
    responseType: 'blob',
  });
  downloadBlob(response.data, 'category-dashboard-report.csv');
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default {
  getStatusDashboard,
  getCategoryDashboard,
  getTagDashboard,
  getContributorDashboard,
  downloadStatusDashboardReport,
  downloadCategoryDashboardReport,
};
