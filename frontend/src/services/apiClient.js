import axios from 'axios'
import { supabase } from './supabaseClient'

const API_URL = 'http://localhost:4000/api'

export const getWithAuth = async (endpoint) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return axios.get(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export const postWithAuth = async (endpoint, body) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return axios.post(`${API_URL}${endpoint}`, body, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export const putWithAuth = async (endpoint, body) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return axios.put(`${API_URL}${endpoint}`, body, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export const deleteWithAuth = async (endpoint) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return axios.delete(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
