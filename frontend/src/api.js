import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export const uploadDocument = async (file, documentType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMatchResult = async (poNumber) => {
  const response = await axios.get(`${API_BASE}/match/${poNumber}`);
  return response.data;
};
