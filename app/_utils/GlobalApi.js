const axios = require("axios");

const SendEmail = (data) => axios.post('/api/send', data);

const GlobalApi = {
    SendEmail
};

export default GlobalApi;
