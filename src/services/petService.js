import api from './api';

export const getPets = async () => {
  const response = await api.get('/pets');
  return response.data;
};

export const getPetById = async (id) => {
  const response = await api.get(`/pets/${id}`);
  return response.data;
};

export const createPet = async (petData) => {
  const response = await api.post('/pets', petData);
  return response.data;
};
