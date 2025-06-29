// lib/phonepe-client.js
import axios from 'axios';
import qs from 'qs';

const PHONEPE_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_PHONEPE_CLIENT_ID || 'TEST-M22H5VMQSVGIC_25041',
  CLIENT_SECRET: process.env.NEXT_PUBLIC_PHONEPE_CLIENT_SECRET || 'MzlhMWZhMzItNDBhMS00OTYzLWI1OWMtMjFmOTlhNzFlMGFl',
  CLIENT_VERSION: '1',
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  CHECKOUT_BASE_URL: 'https://mercury-uat.phonepe.com'
};

class PhonePeClientService {
  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('phonepe_token');
      this.tokenExpiry = localStorage.getItem('phonepe_token_expiry');
    }
  }

  async getAccessToken() {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < parseInt(this.tokenExpiry)) {
      return this.accessToken;
    }

    try {
      const data = qs.stringify({
        'client_id': PHONEPE_CONFIG.CLIENT_ID,
        'client_version': PHONEPE_CONFIG.CLIENT_VERSION,
        'client_secret': PHONEPE_CONFIG.CLIENT_SECRET,
        'grant_type': 'client_credentials'
      });

      const config = {
        method: 'post',
        url: `${PHONEPE_CONFIG.BASE_URL}/v1/oauth/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data,
        timeout: 30000
      };

      const response = await axios.request(config);
      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      
      // Store in localStorage for static builds
      if (typeof window !== 'undefined') {
        localStorage.setItem('phonepe_token', this.accessToken);
        localStorage.setItem('phonepe_token_expiry', this.tokenExpiry.toString());
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  async createPayment(paymentData) {
    try {
      const token = await this.getAccessToken();
      
      const data = JSON.stringify({
        merchantOrderId: paymentData.merchantOrderId,
        amount: paymentData.amount,
        expireAfter: paymentData.expireAfter || 1200,
        metaInfo: paymentData.metaInfo || {},
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: paymentData.message || "Complete your payment",
          merchantUrls: {
            redirectUrl: paymentData.redirectUrl
          }
        }
      });

      const config = {
        method: 'post',
        url: `${PHONEPE_CONFIG.BASE_URL}/checkout/v2/pay`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`
        },
        data: data,
        timeout: 30000
      };

      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const token = await this.getAccessToken();

      const config = {
        method: 'get',
        url: `${PHONEPE_CONFIG.BASE_URL}/checkout/v2/order/${orderId}/status`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`
        },
        timeout: 30000
      };

      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw new Error('Failed to get payment status');
    }
  }
}

export const phonePeClientService = new PhonePeClientService();