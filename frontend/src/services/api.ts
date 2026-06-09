const API_BASE_URL = "http://localhost:8000/api";

// Helper to get auth headers
const getHeaders = (isMultipart = false) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Generic response handler
async function handleResponse(response: Response) {
  if (!response.ok) {
    let errMsg = "Something went wrong";
    try {
      const errData = await response.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errMsg);
  }
  return response.json();
}

export const api = {
  // Auth Operations
  auth: {
    async login(email: string, password: string) {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });
      const data = await handleResponse(res);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }
      return data;
    },
    
    async signup(name: string, email: string, password: string) {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password })
      });
      return handleResponse(res);
    },
    
    async getMe() {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async updateProfile(name?: string, email?: string, password?: string) {
      const payload: Record<string, string> = {};
      if (name) payload.name = name;
      if (email) payload.email = email;
      if (password) payload.password = password;

      const res = await fetch(`${API_BASE_URL}/auth/update`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },

    logout() {
      localStorage.removeItem("token");
    }
  },
  
  // Carbon Footprint Tracker
  carbon: {
    async getDashboard() {
      const res = await fetch(`${API_BASE_URL}/carbon/dashboard`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async getHistory() {
      const res = await fetch(`${API_BASE_URL}/carbon/history`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async addEntry(category: string, details: Record<string, any>) {
      const res = await fetch(`${API_BASE_URL}/carbon/calculate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ category, details })
      });
      return handleResponse(res);
    },
    
    async uploadBill(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_BASE_URL}/carbon/upload-bill`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData
      });
      return handleResponse(res);
    }
  },
  
  // Incident Reports
  incident: {
    async report(locationText: string, category: string, description: string, severity: string, imageBase64?: string, lat?: number, lng?: number) {
      const payload = {
        location_text: locationText,
        category,
        description,
        severity,
        image_data: imageBase64 || null,
        latitude: lat || null,
        longitude: lng || null
      };
      
      const res = await fetch(`${API_BASE_URL}/incident/report`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    
    async getAll() {
      const res = await fetch(`${API_BASE_URL}/incident/all`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async getDetails(id: number) {
      const res = await fetch(`${API_BASE_URL}/incident/${id}`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  
  // Gamification & Challenges
  gamification: {
    async getLeaderboard() {
      const res = await fetch(`${API_BASE_URL}/gamification/leaderboard`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async getChallenges() {
      const res = await fetch(`${API_BASE_URL}/gamification/challenge/all`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async getActiveChallenges() {
      const res = await fetch(`${API_BASE_URL}/gamification/challenge/active`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async joinChallenge(challengeId: number) {
      const res = await fetch(`${API_BASE_URL}/gamification/challenge/join/${challengeId}`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async updateProgress(challengeId: number, progressDelta: number) {
      const res = await fetch(`${API_BASE_URL}/gamification/challenge/update/${challengeId}?progress_delta=${progressDelta}`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  
  // Community Events
  events: {
    async getAll() {
      const res = await fetch(`${API_BASE_URL}/events/all`, {
        method: "GET",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async create(title: string, description: string, organizer: string, date: string, locationText: string, lat?: number, lng?: number, imageUrl?: string) {
      const payload = {
        title,
        description,
        organizer,
        date,
        location_text: locationText,
        latitude: lat || null,
        longitude: lng || null,
        image_url: imageUrl || null
      };
      const res = await fetch(`${API_BASE_URL}/events/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    
    async join(eventId: number) {
      const res = await fetch(`${API_BASE_URL}/events/join/${eventId}`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },
  
  // AI Services & Chat
  ai: {
    async getRecommendations() {
      const res = await fetch(`${API_BASE_URL}/recommendation`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    
    async sendMessage(history: Array<{ sender: string; text: string }>, message: string) {
      const res = await fetch(`${API_BASE_URL}/chatbot`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ history, message })
      });
      return handleResponse(res);
    }
  }
};
