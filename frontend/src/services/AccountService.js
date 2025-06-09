import axios from 'axios';

const API_URL = '/api';
const DEFAULT_USER_ID = 'default_user';

class AccountService {
  /**
   * Fetches the virtual account details.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} The user's virtual account data.
   */
  async getAccount(userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.get(`${API_URL}/account`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching virtual account:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Deploys a new trading bot.
   * @param {string} strategy - The selected rebalancing strategy.
   * @param {number} riskProfile - The user's risk profile (0-100).
   * @param {number} allocatedFund - The amount of virtual currency to allocate.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} The newly created bot object.
   */
  async deployBot(strategy, riskProfile, allocatedFund, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.post(`${API_URL}/bots/deploy`, {
        strategy,
        riskProfile,
        allocatedFund,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error("Error deploying bot:", error);
      throw this._formatError(error);
    }
  }

  /**
   * Stops an active trading bot.
   * @param {string} botId - The ID of the bot to stop.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} A confirmation message.
   */
  async stopBot(botId, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.post(`${API_URL}/bots/${botId}/stop`, {
        user_id: userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error stopping bot ${botId}:`, error);
      throw this._formatError(error);
    }
  }
  
  /**
   * Resumes a stopped trading bot.
   * @param {string} botId - The ID of the bot to resume.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} A confirmation message.
   */
  async resumeBot(botId, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.post(`${API_URL}/bots/${botId}/resume`, {
        user_id: userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error resuming bot ${botId}:`, error);
      throw this._formatError(error);
    }
  }
  
  /**
   * Deletes a stopped trading bot permanently.
   * @param {string} botId - The ID of the bot to delete.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} A confirmation message.
   */
  async deleteBot(botId, userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.delete(`${API_URL}/bots/${botId}/delete`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting bot ${botId}:`, error);
      throw this._formatError(error);
    }
  }
  
  /**
   * Fetches performance history for the account and all bots.
   * @param {string} userId - Optional user ID (defaults to default_user)
   * @returns {Promise<Object>} Performance history data.
   */
  async getPerformanceHistory(userId = DEFAULT_USER_ID) {
    try {
      const response = await axios.get(`${API_URL}/portfolio/performance`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching performance history:", error);
      throw this._formatError(error);
    }
  }
  
  /**
   * Formats error responses consistently.
   * @private
   * @param {Error} error - The caught error.
   * @returns {Error} Formatted error.
   */
  _formatError(error) {
    if (error.response && error.response.data && error.response.data.error) {
      return new Error(error.response.data.error);
    }
    return error;
  }
}

export default new AccountService(); 